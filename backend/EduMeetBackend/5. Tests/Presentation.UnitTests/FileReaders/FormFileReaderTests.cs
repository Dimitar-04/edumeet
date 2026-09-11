using _4._Presentation.FileReaders;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace Presentation.UnitTests.FileReaders;

public sealed class FormFileReaderTests
{
    private const long OneMegabyte = 1024 * 1024;

    [Fact]
    public async Task ReadImageAsync_WhenImageIsValid_ReturnsUploadedFile()
    {
        byte[] imageBytes = [1, 2, 3, 4];
        var image = CreateFormFile(
            imageBytes,
            imageBytes.Length,
            "profile.png",
            "image/png");

        var result = await FormFileReader.ReadImageAsync(
            image,
            OneMegabyte);

        Assert.True(result.Succeeded);
        Assert.Null(result.Error);
        Assert.NotNull(result.File);
        Assert.Equal(imageBytes, result.File.Bytes);
        Assert.Equal("profile.png", result.File.OriginalFileName);
        Assert.Equal("image/png", result.File.ContentType);
    }

    [Theory]
    [InlineData(InvalidImage.Oversized, "The image cannot exceed 1 MB.")]
    [InlineData(
        InvalidImage.UnsupportedType,
        "The image must be a JPEG, PNG, or WebP file.")]
    public async Task ReadImageAsync_WhenImageIsInvalid_ReturnsValidationError(
        InvalidImage invalidImage,
        string expectedError)
    {
        var image = invalidImage switch
        {
            InvalidImage.Oversized => CreateFormFile(
                [1],
                OneMegabyte + 1,
                "profile.png",
                "image/png"),
            InvalidImage.UnsupportedType => CreateFormFile(
                [1, 2, 3],
                3,
                "profile.gif",
                "image/gif"),
            _ => throw new ArgumentOutOfRangeException(nameof(invalidImage))
        };

        var result = await FormFileReader.ReadImageAsync(
            image,
            OneMegabyte);

        Assert.False(result.Succeeded);
        Assert.Null(result.File);
        Assert.Equal(expectedError, result.Error);
    }

    public enum InvalidImage
    {
        Oversized,
        UnsupportedType
    }

    private static FormFile CreateFormFile(
        byte[] bytes,
        long declaredLength,
        string fileName,
        string contentType)
    {
        var stream = new MemoryStream(bytes);

        return new FormFile(
            stream,
            baseStreamOffset: 0,
            declaredLength,
            name: "image",
            fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }
}
