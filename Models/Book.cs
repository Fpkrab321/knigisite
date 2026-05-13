namespace BookSite.Models;

public class Book
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? ImagePath { get; set; }
    public string? Tags { get; set; }
    public bool IsFeatured { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
