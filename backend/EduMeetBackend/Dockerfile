FROM mcr.microsoft.com/dotnet/sdk:10.0 AS restore
WORKDIR /src

COPY ["1. Domain/Domain.csproj", "1. Domain/"]
COPY ["2. Application/Application.csproj", "2. Application/"]
COPY ["3. Infrastructure/Infrastructure.csproj", "3. Infrastructure/"]
COPY ["4. Presentation/Presentation.csproj", "4. Presentation/"]
RUN dotnet restore "4. Presentation/Presentation.csproj"

FROM restore AS build
COPY . .
RUN dotnet publish "4. Presentation/Presentation.csproj" \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM restore AS migrations
COPY . .
RUN dotnet tool install --global dotnet-ef --version 10.0.10
ENV PATH="/root/.dotnet/tools:${PATH}"
ENTRYPOINT ["dotnet-ef", "database", "update", "--project", "3. Infrastructure/Infrastructure.csproj", "--startup-project", "4. Presentation/Presentation.csproj"]

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p wwwroot/uploads/event-images wwwroot/uploads/profile-images
EXPOSE 5062
ENTRYPOINT ["dotnet", "Presentation.dll"]
