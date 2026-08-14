using _2._Application.Requests;

namespace _4._Presentation.FileReaders;

public static class FormFileReader
{
    private static readonly HashSet<string> AllowedImageTypes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

    public static async Task<FormFileReadResult> ReadImageAsync(
        IFormFile? file,
        long maximumSizeBytes,
        CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
        {
            return new FormFileReadResult(null, "Please select a file.");
        }

        if (file.Length > maximumSizeBytes)
        {
            var maximumSizeMb =
                maximumSizeBytes / 1024d / 1024d;

            return new FormFileReadResult(
                null,
                $"The image cannot exceed {maximumSizeMb:0.#} MB.");
        }

        if (!AllowedImageTypes.Contains(file.ContentType))
        {
            return new FormFileReadResult(
                null,
                "The image must be a JPEG, PNG, or WebP file.");
        }

        await using var memoryStream = new MemoryStream();

        await file.CopyToAsync(
            memoryStream,
            cancellationToken);

        var uploadedFile = new UploadedFileData(
            memoryStream.ToArray(),
            Path.GetFileName(file.FileName),
            file.ContentType);

        return new FormFileReadResult(
            uploadedFile,
            null);
    }
}
