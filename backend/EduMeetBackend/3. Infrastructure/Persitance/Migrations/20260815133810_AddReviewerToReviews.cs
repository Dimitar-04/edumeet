using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3._Infrastracture.Persitance.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewerToReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reviews_EducationalEventId",
                table: "Reviews");

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewerId",
                table: "Reviews",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_EducationalEventId_ReviewerId",
                table: "Reviews",
                columns: new[] { "EducationalEventId", "ReviewerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ReviewerId",
                table: "Reviews",
                column: "ReviewerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_IndividualProfiles_ReviewerId",
                table: "Reviews",
                column: "ReviewerId",
                principalTable: "IndividualProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_IndividualProfiles_ReviewerId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_EducationalEventId_ReviewerId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_ReviewerId",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "ReviewerId",
                table: "Reviews");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_EducationalEventId",
                table: "Reviews",
                column: "EducationalEventId");
        }
    }
}
