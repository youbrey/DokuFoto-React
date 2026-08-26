using FluentAssertions;
using SetwanDokuFoto.Core.Models;
using SetwanDokuFoto.Data;
using Xunit;

namespace SetwanDokuFoto.Data.Tests;

public class SqliteProjectRepositoryTests
{
    [Fact]
    public async Task SaveAndLoadProjectAsync_Should_Persist_Project_And_EmbedBytes()
    {
        var tempFolder = Path.Combine(Path.GetTempPath(), $"dokufoto_test_{Guid.NewGuid()}");
        Directory.CreateDirectory(tempFolder);

        var dbPath = Path.Combine(tempFolder, "test.db");
        var projectFile = Path.Combine(tempFolder, "sample_project.dokufoto.json");

        try
        {
            var repository = new SqliteProjectRepository(dbPath);
            var project = new DocumentProject
            {
                Title = "DOKUMENTASI SIDANG PARIPURNA DPRD KOTA BITUNG",
                DocumentNumber = "001/SETWAN/2026"
            };

            var page = new DocumentPage { Title = "Halaman Uji Coba" };
            var sampleBytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46 };
            page.Cells.Add(new CollageCell
            {
                Row = 0,
                Column = 0,
                Caption = "Foto Pembukaan Rapat",
                Photo = new PhotoItem
                {
                    FileName = "foto1.jpg",
                    ImageBytes = sampleBytes
                }
            });
            project.Pages.Add(page);

            // Act: Save
            await repository.SaveProjectAsync(project, projectFile);

            // Assert: File exists
            File.Exists(projectFile).Should().BeTrue();

            // Act: Load
            var loaded = await repository.LoadProjectAsync(projectFile);

            // Assert
            loaded.Should().NotBeNull();
            loaded.Title.Should().Be(project.Title);
            loaded.Pages.Should().HaveCount(1);
            loaded.Pages[0].Cells.Should().HaveCount(1);
            loaded.Pages[0].Cells[0].Photo.Should().NotBeNull();
            loaded.Pages[0].Cells[0].Photo!.ImageBytes.Should().BeEquivalentTo(sampleBytes);

            // Check catalog
            var recents = await repository.GetRecentProjectsAsync(5);
            recents.Should().Contain(p => p.Id == project.Id && p.Title == project.Title);
        }
        finally
        {
            if (Directory.Exists(tempFolder))
            {
                try { Directory.Delete(tempFolder, true); } catch { }
            }
        }
    }
}
