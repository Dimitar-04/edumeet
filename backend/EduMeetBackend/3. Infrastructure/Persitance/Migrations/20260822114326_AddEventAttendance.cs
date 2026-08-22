using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _3._Infrastracture.Persitance.Migrations
{
    /// <inheritdoc />
    public partial class AddEventAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AttendanceTokenHash",
                table: "EventParticipants",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CheckedInAtUtc",
                table: "EventParticipants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CheckedInByUserId",
                table: "EventParticipants",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventParticipants_AttendanceTokenHash",
                table: "EventParticipants",
                column: "AttendanceTokenHash",
                unique: true,
                filter: "\"AttendanceTokenHash\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_EventParticipants_CheckedInByUserId",
                table: "EventParticipants",
                column: "CheckedInByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_EventParticipants_EducationalEventId_CheckedInAtUtc",
                table: "EventParticipants",
                columns: new[] { "EducationalEventId", "CheckedInAtUtc" });

            migrationBuilder.AddForeignKey(
                name: "FK_EventParticipants_AspNetUsers_CheckedInByUserId",
                table: "EventParticipants",
                column: "CheckedInByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EventParticipants_AspNetUsers_CheckedInByUserId",
                table: "EventParticipants");

            migrationBuilder.DropIndex(
                name: "IX_EventParticipants_AttendanceTokenHash",
                table: "EventParticipants");

            migrationBuilder.DropIndex(
                name: "IX_EventParticipants_CheckedInByUserId",
                table: "EventParticipants");

            migrationBuilder.DropIndex(
                name: "IX_EventParticipants_EducationalEventId_CheckedInAtUtc",
                table: "EventParticipants");

            migrationBuilder.DropColumn(
                name: "AttendanceTokenHash",
                table: "EventParticipants");

            migrationBuilder.DropColumn(
                name: "CheckedInAtUtc",
                table: "EventParticipants");

            migrationBuilder.DropColumn(
                name: "CheckedInByUserId",
                table: "EventParticipants");
        }
    }
}
