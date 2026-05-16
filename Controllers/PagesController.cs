using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BookSite.Data;

namespace BookSite.Controllers;

[Controller]
[Route("")]
public class PagesController : Controller
{
    private readonly AppDbContext _context;

    public PagesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("")]
    [HttpGet("index")]
    public async Task<IActionResult> Index()
    {
        var books = await _context.Books.OrderByDescending(b => b.IsFeatured).ThenBy(b => b.Title).ToListAsync();
        return View("Index", books);
    }

    [HttpGet("admin")]
    public IActionResult Admin()
    {
        return View("Admin");
    }

    [HttpGet("login")]
    public IActionResult Login()
    {
        return View("Login");
    }
}
