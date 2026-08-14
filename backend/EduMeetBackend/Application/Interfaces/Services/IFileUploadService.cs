using _2._Application.Requests;

namespace _2._Application.Interfaces;

public interface IFileUploadService
{
    public Task<string> UploadFileAsync(byte[] fileBytes, string originalFileName, string folder = "uploads");

}
