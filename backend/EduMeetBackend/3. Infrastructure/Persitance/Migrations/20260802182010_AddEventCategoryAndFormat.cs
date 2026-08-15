using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3._Infrastracture.Persitance.Migrations
{
    /// <inheritdoc />
    public partial class AddEventCategoryAndFormat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "EducationalEvents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Format",
                table: "EducationalEvents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "EducationalEvents");

            migrationBuilder.DropColumn(
                name: "Format",
                table: "EducationalEvents");
        }
    }
}
