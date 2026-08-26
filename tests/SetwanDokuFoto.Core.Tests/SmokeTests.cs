using FluentAssertions;
using SetwanDokuFoto.Core.Models;
using Xunit;

namespace SetwanDokuFoto.Core.Tests;

public class CoreSmokeTests
{
    [Fact]
    public void DocumentProject_DefaultValues_Should_Match_Setwan_Standard()
    {
        var project = new DocumentProject();
        project.PaperSize.Should().Be("F4");
        project.Orientation.Should().Be("Portrait");
        project.KopSurat.Should().NotBeNull();
        project.KopSurat.Enabled.Should().BeTrue();
        project.KopSurat.GovernmentName.Should().Contain("BITUNG");
    }

    [Theory]
    [InlineData("4:3", 4.0, 3.0)]
    [InlineData("16:9", 16.0, 9.0)]
    [InlineData("1:1", 1.0, 1.0)]
    [InlineData("3:4", 3.0, 4.0)]
    [InlineData("invalid", 4.0, 3.0)]
    public void CanvaCropMath_ParseAspectRatio_Should_Parse_Correctly(string ratio, double expectedW, double expectedH)
    {
        var (w, h) = CanvaCropMath.ParseAspectRatio(ratio);
        w.Should().Be(expectedW);
        h.Should().Be(expectedH);
    }

    [Fact]
    public void CanvaCropMath_CalculateCoverScale_Should_Fit_Or_Cover()
    {
        // Frame: 400x300 (4:3), Image: 800x600 (4:3) -> scale should be 0.5
        var scale = CanvaCropMath.CalculateCoverScale(400, 300, 800, 600);
        scale.Should().BeApproximately(0.5, 0.001);

        // Frame: 400x300, Image: 1000x500 (2:1) -> height governs, scale = 300/500 = 0.6
        var scale2 = CanvaCropMath.CalculateCoverScale(400, 300, 1000, 500);
        scale2.Should().BeApproximately(0.6, 0.001);
    }

    [Fact]
    public void CanvaCropMath_CalculateCoverScale_ZeroDimensions_Should_Return_Zero()
    {
        CanvaCropMath.CalculateCoverScale(0, 300, 800, 600).Should().Be(0);
        CanvaCropMath.CalculateCoverScale(400, 0, 800, 600).Should().Be(0);
        CanvaCropMath.CalculateCoverScale(400, 300, 0, 600).Should().Be(0);
        CanvaCropMath.CalculateCoverScale(400, 300, 800, 0).Should().Be(0);
    }

    [Fact]
    public void PhotoTransform_Snapshot_And_Restore_Should_Work()
    {
        var transform = new PhotoTransform
        {
            OffsetX = 0.25,
            OffsetY = -0.15,
            Scale = 1.8,
            Rotation = 90,
            FlipHorizontal = true,
            FlipVertical = false
        };

        var snapshot = transform.Snapshot();
        transform.Reset();

        transform.OffsetX.Should().Be(0);
        transform.Scale.Should().Be(1);
        transform.Rotation.Should().Be(0);

        transform.Restore(snapshot);

        transform.OffsetX.Should().Be(0.25);
        transform.OffsetY.Should().Be(-0.15);
        transform.Scale.Should().Be(1.8);
        transform.Rotation.Should().Be(90);
        transform.FlipHorizontal.Should().BeTrue();
    }

    [Fact]
    public void PhotoTransform_Rotation_Should_Normalize_Angles()
    {
        var transform = new PhotoTransform();
        transform.Rotation = 450;
        transform.Rotation.Should().Be(90);

        transform.Rotation = -90;
        transform.Rotation.Should().Be(270);
    }
}
