using _1._Domain.Models;
using _2._Application.Auth.Requests;
using AutoMapper;

namespace _2._Application.Auth.Mappings;

public sealed class AuthMappingProfile : Profile
{
    public AuthMappingProfile()
    {
        CreateMap<RegisterRequest, AppUser>(MemberList.None)
            .ForMember(
                destination => destination.UserName,
                options => options.MapFrom(source => source.UserName.Trim()))
            .ForMember(
                destination => destination.Email,
                options => options.MapFrom(source => source.Email.Trim()))
            .ForMember(
                destination => destination.PhoneNumber,
                options => options.MapFrom(source =>
                    string.IsNullOrWhiteSpace(source.PhoneNumber)
                        ? null
                        : source.PhoneNumber.Trim()));

        CreateMap<IndividualRegistrationRequest, IndividualProfile>(
                MemberList.None)
            .ForMember(
                destination => destination.FirstName,
                options => options.MapFrom(source => source.FirstName.Trim()))
            .ForMember(
                destination => destination.LastName,
                options => options.MapFrom(source => source.LastName.Trim()));

        CreateMap<OrganizationRegistrationRequest, OrganizationProfile>(
                MemberList.None)
            .ForMember(
                destination => destination.Name,
                options => options.MapFrom(source => source.Name.Trim()))
            .ForMember(
                destination => destination.Website,
                options => options.MapFrom(source =>
                    string.IsNullOrWhiteSpace(source.Website)
                        ? null
                        : source.Website.Trim()))
            .ForMember(
                destination => destination.LogoUrl,
                options => options.MapFrom(source =>
                    string.IsNullOrWhiteSpace(source.LogoUrl)
                        ? null
                        : source.LogoUrl.Trim()));
    }
}
