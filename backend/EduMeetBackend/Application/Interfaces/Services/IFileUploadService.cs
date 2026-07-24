using _2._Application.Auth.Requests;

namespace _2._Application.Interfaces;

public interface IFileUploadService
{
    public Task<string> UploadFileAsync(byte[] fileBytes, string originalFileName, string folder = "uploads");

}