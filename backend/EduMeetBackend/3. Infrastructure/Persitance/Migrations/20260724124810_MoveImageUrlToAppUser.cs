using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3._Infrastracture.Persitance.Migrations
{
    /// <inheritdoc />
    public partial class MoveImageUrlToAppUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "OrganizationProfiles");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "AspNetUsers",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "OrganizationProfiles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }
    }
}
