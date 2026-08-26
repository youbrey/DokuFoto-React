using FluentAssertions;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using SetwanDokuFoto.Core.Models;
using SetwanDokuFoto.DocxEngine;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.PixelFormats;
using Xunit;

namespace SetwanDokuFoto.DocxEngine.Tests;

public class DocxEngineSmokeTests
{
    [Fact]
    public async Task ExportToDocxAsync_Should_Create_Valid_Docx_File()
    {
        // Arrange
        var service = new DocxExportService();
        var project = new DocumentProject();
        var tempFile = Path.Combine(Path.GetTempPath(), $"test_export_{Guid.NewGuid()}.docx");

        try
        {
            // Act
            await service.ExportToDocxAsync(project, tempFile);

            // Assert
            File.Exists(tempFile).Should().BeTrue();
            var fileInfo = new FileInfo(tempFile);
            fileInfo.Length.Should().BeGreaterThan(100);
        }
        finally
        {
            if (File.Exists(tempFile))
            {
                File.Delete(tempFile);
            }
        }
    }

    [Fact]
    public async Task ExportToDocxAsync_Should_Embed_HighResolution_Cropped_Photo()
    {
        var service = new DocxExportService();
        var project = new DocumentProject();
        var page = new DocumentPage();
        var photoBytes = CreateJpeg();
        page.Cells.Add(new CollageCell
        {
            Row = 0,
            Column = 0,
            AspectRatio = "4:3",
            Photo = new PhotoItem
            {
                FileName = "sample.jpg",
                ImageBytes = photoBytes,
                Transform = new PhotoTransform { Scale = 1.25, OffsetX = .08, Rotation = 8 }
            }
        });
        project.Pages.Add(page);
        var tempFile = Path.Combine(Path.GetTempPath(), $"test_photo_export_{Guid.NewGuid()}.docx");

        try
        {
            await service.ExportToDocxAsync(project, tempFile);

            using var document = WordprocessingDocument.Open(tempFile, false);
            document.MainDocumentPart!.ImageParts.Should().ContainSingle();
            document.MainDocumentPart.Document.Descendants<Drawing>().Should().ContainSingle();
        }
        finally
        {
            if (File.Exists(tempFile)) File.Delete(tempFile);
        }
    }

    private static byte[] CreateJpeg()
    {
        using var image = new Image<Rgba32>(640, 480, new Rgba32(30, 144, 255));
        using var stream = new MemoryStream();
        image.Save(stream, new JpegEncoder());
        return stream.ToArray();
    }
}
