using Microsoft.EntityFrameworkCore;
using BookSite.Models;

namespace BookSite.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Book> Books { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Book>().HasData(
            new Book
            {
                Id = 1,
                Title = "Война и мир",
                Author = "Лев Толстой",
                ShortDescription = "Великий роман об Отечественной войне 1812 года",
                Description = "Роман-эпопея, описывающий русское общество в эпоху войн против Наполеона. Произведение охватывает период с 1805 по 1820 год. В центре повествования — судьбы нескольких дворянских семей на фоне исторических событий. Толстой показывает единство народа перед лицом общей угрозы, героизм русских солдат и офицеров, патриотический подъём общества.",
                Genre = "Роман-эпопея",
                Year = 1869,
                Tags = "классика,война,патриотизм,история",
                IsFeatured = true,
                BookText = null,
                ImagePath = null
            },
            new Book
            {
                Id = 2,
                Title = "Тихий Дон",
                Author = "Михаил Шолохов",
                ShortDescription = "Сага о судьбе донского казачества",
                Description = "Роман-эпопея о жизни донских казаков в период Первой мировой войны, революции и Гражданской войны в России.",
                Genre = "Роман-эпопея",
                Year = 1940,
                Tags = "казаки,история,гражданская война,классика",
                IsFeatured = true,
                BookText = null,
                ImagePath = null
            },
            new Book
            {
                Id = 3,
                Title = "Капитанская дочка",
                Author = "Александр Пушкин",
                ShortDescription = "Повесть о чести и долге в эпоху пугачёвского восстания",
                Description = "Историческая повесть, действие которой разворачивается во времена восстания Пугачёва.",
                Genre = "Историческая повесть",
                Year = 1836,
                Tags = "Пушкин,история,честь,классика",
                IsFeatured = false,
                BookText = null,
                ImagePath = null
            },
            new Book
            {
                Id = 4,
                Title = "В окопах Сталинграда",
                Author = "Виктор Некрасов",
                ShortDescription = "Правдивая повесть о Сталинградской битве",
                Description = "Повесть о Сталинградской битве, написанная участником событий.",
                Genre = "Военная проза",
                Year = 1946,
                Tags = "война,Сталинград,ВОВ,память",
                IsFeatured = true,
                BookText = null,
                ImagePath = null
            },
            new Book
            {
                Id = 5,
                Title = "Матрёнин двор",
                Author = "Александр Солженицын",
                ShortDescription = "История о праведнице русской деревни",
                Description = "Рассказ о простой крестьянке Матрёне, воплощающей нравственный идеал русского человека.",
                Genre = "Рассказ",
                Year = 1963,
                Tags = "деревня,народ,нравственность,классика",
                IsFeatured = false,
                BookText = null,
                ImagePath = null
            },
            new Book
            {
                Id = 6,
                Title = "Повесть о настоящем человеке",
                Author = "Борис Полевой",
                ShortDescription = "История подвига лётчика Алексея Мересьева",
                Description = "Документальная повесть о реальном подвиге советского лётчика Алексея Маресьева.",
                Genre = "Документальная проза",
                Year = 1946,
                Tags = "война,подвиг,лётчик,ВОВ,героизм",
                IsFeatured = false,
                BookText = null,
                ImagePath = null
            }
        );
    }
}
