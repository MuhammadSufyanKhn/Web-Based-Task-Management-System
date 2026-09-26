using Microsoft.EntityFrameworkCore;
using TaskManagerAPI.Models;

namespace TaskManagementAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Users> Users { get; set; }
        public DbSet<TaskItem> TaskItems { get; set; }
        public DbSet<ProjectStatus> ProjectStatuses { get; set; }
        public DbSet<IssueType> IssueTypes { get; set; }
        public DbSet<TaskPriority> TaskPriorities { get; set; }
        public DbSet<Label> Labels { get; set; }
        public DbSet<TaskLabel> TaskLabels { get; set; }
        public DbSet<ProjectComponent> ProjectComponents { get; set; }
        public DbSet<WorkflowTransition> WorkflowTransitions { get; set; }
        public DbSet<JiraSetting> JiraSettings { get; set; }
        public DbSet<Sprint> Sprints { get; set; }
        public DbSet<Epic> Epics { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Users>().ToTable("Users");
            modelBuilder.Entity<TaskItem>().ToTable("Task");
            modelBuilder.Entity<ProjectStatus>().ToTable("ProjectStatuses");
            modelBuilder.Entity<IssueType>().ToTable("IssueTypes");
            modelBuilder.Entity<TaskPriority>().ToTable("TaskPriorities");
            modelBuilder.Entity<Label>().ToTable("Labels");
            modelBuilder.Entity<ProjectComponent>().ToTable("ProjectComponents");
            modelBuilder.Entity<WorkflowTransition>().ToTable("WorkflowTransitions");
            modelBuilder.Entity<JiraSetting>().ToTable("JiraSettings");
            modelBuilder.Entity<Sprint>().ToTable("Sprints");
            modelBuilder.Entity<Epic>().ToTable("Epics");

            // User - Task relation
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.User)
                .WithMany(u => u.Tasks)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Self-referencing Parent Task - Subtasks relation
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.ParentTask)
                .WithMany(t => t.Subtasks)
                .HasForeignKey(t => t.ParentTaskId)
                .OnDelete(DeleteBehavior.Restrict);

            // Task - TaskLabel Composite Key & Many-to-Many
            modelBuilder.Entity<TaskLabel>()
                .ToTable("TaskLabels")
                .HasKey(tl => new { tl.TaskId, tl.LabelId });

            modelBuilder.Entity<TaskLabel>()
                .HasOne(tl => tl.Task)
                .WithMany(t => t.TaskLabels)
                .HasForeignKey(tl => tl.TaskId);

            modelBuilder.Entity<TaskLabel>()
                .HasOne(tl => tl.Label)
                .WithMany(l => l.TaskLabels)
                .HasForeignKey(tl => tl.LabelId);

            // Task - Sprint relation
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.Sprint)
                .WithMany(s => s.Tasks)
                .HasForeignKey(t => t.SprintId)
                .OnDelete(DeleteBehavior.SetNull);

            // Task - Epic relation
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.Epic)
                .WithMany(e => e.Tasks)
                .HasForeignKey(t => t.EpicId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
