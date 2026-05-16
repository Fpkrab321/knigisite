using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BookSite.Data;
using BookSite.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace BookSite.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public BooksController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var books = await _context.Books
            .Select(b => new {
                b.Id, b.Title, b.Author, b.Description, b.ShortDescription,
                b.Genre, b.Year, b.ImagePath, b.Tags, b.IsFeatured, b.CreatedAt,
                hasText = b.BookText != null && b.BookText.Length > 0
            })
            .OrderByDescending(b => b.IsFeatured).ThenBy(b => b.Title)
            .ToListAsync();
        return Ok(books);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();
        return Ok(book);
    }

    [HttpGet("{id}/text")]
    public async Task<IActionResult> GetBookText(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();
        return Ok(new { id = book.Id, title = book.Title, author = book.Author, text = book.BookText ?? "" });
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] BookCreateDto dto)
    {
        var book = new Book
        {
            Title = dto.Title,
            Author = dto.Author,
            Description = dto.Description,
            ShortDescription = dto.ShortDescription,
            Genre = dto.Genre,
            Year = dto.Year,
            Tags = dto.Tags,
            IsFeatured = dto.IsFeatured,
            BookText = dto.BookText,
            CreatedAt = DateTime.UtcNow
        };

        if (dto.Image != null)
            book.ImagePath = await SaveImage(dto.Image);

        _context.Books.Add(book);
        await _context.SaveChangesAsync();
        return Ok(book);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] BookCreateDto dto)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        book.Title = dto.Title;
        book.Author = dto.Author;
        book.Description = dto.Description;
        book.ShortDescription = dto.ShortDescription;
        book.Genre = dto.Genre;
        book.Year = dto.Year;
        book.Tags = dto.Tags;
        book.IsFeatured = dto.IsFeatured;
        book.BookText = dto.BookText;

        if (dto.Image != null)
        {
            if (book.ImagePath != null)
            {
                var oldPath = Path.Combine(_env.WebRootPath, book.ImagePath.TrimStart('/'));
                if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
            }
            book.ImagePath = await SaveImage(dto.Image);
        }

        await _context.SaveChangesAsync();
        return Ok(book);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        if (book.ImagePath != null)
        {
            var path = Path.Combine(_env.WebRootPath, book.ImagePath.TrimStart('/'));
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
        return Ok();
    }

    [Authorize]
    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file");
        var path = await SaveImage(file);
        return Ok(new { path });
    }

    [Authorize]
    [HttpPost("process-image")]
    public async Task<IActionResult> ProcessImage([FromForm] ImageProcessDto dto)
    {
        if (dto.File == null) return BadRequest();

        using var stream = dto.File.OpenReadStream();
        using var image = await Image.LoadAsync(stream);

        if (dto.CropX.HasValue && dto.CropY.HasValue && dto.CropWidth.HasValue && dto.CropHeight.HasValue)
        {
            var rect = new Rectangle(dto.CropX.Value, dto.CropY.Value, dto.CropWidth.Value, dto.CropHeight.Value);
            image.Mutate(x => x.Crop(rect));
        }

        if (dto.Rotation.HasValue && dto.Rotation.Value != 0)
            image.Mutate(x => x.Rotate(dto.Rotation.Value));

        image.Mutate(x => x.Resize(new ResizeOptions { Size = new Size(800, 1200), Mode = ResizeMode.Max }));

        var fileName = $"proc_{Guid.NewGuid()}.jpg";
        var uploadsDir = Path.Combine(_env.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);
        var filePath = Path.Combine(uploadsDir, fileName);
        await image.SaveAsJpegAsync(filePath);
        return Ok(new { path = $"/uploads/{fileName}" });
    }

    private async Task<string> SaveImage(IFormFile file)
    {
        var uploadsDir = Path.Combine(_env.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        if (!allowed.Contains(ext)) ext = ".jpg";

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using var stream = file.OpenReadStream();
        using var image = await Image.LoadAsync(stream);
        image.Mutate(x => x.Resize(new ResizeOptions { Size = new Size(800, 1200), Mode = ResizeMode.Max }));
        await image.SaveAsJpegAsync(filePath);

        return $"/uploads/{fileName}";
    }
}

public class BookCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? Tags { get; set; }
    public bool IsFeatured { get; set; }
    public string? BookText { get; set; }
    public IFormFile? Image { get; set; }
}

public class ImageProcessDto
{
    public IFormFile? File { get; set; }
    public int? CropX { get; set; }
    public int? CropY { get; set; }
    public int? CropWidth { get; set; }
    public int? CropHeight { get; set; }
    public float? Rotation { get; set; }
}
