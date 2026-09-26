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
        public DbSet<TaskTimeLog> TaskTimeLogs { get; set; }
        public DbSet<TaskDependency> TaskDependencies { get; set; }
        public DbSet<TaskActivityLog> TaskActivityLogs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<JiraSyncLog> JiraSyncLogs { get; set; }

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
            modelBuilder.Entity<JiraSetting>().ToTable("JiraSettings").Ignore(j => j.LastSyncedAt);
            modelBuilder.Entity<Sprint>().ToTable("Sprints");
            modelBuilder.Entity<Epic>().ToTable("Epics");
            modelBuilder.Entity<TaskTimeLog>().ToTable("TaskTimeLogs");
            modelBuilder.Entity<TaskDependency>().ToTable("TaskDependencies");
            modelBuilder.Entity<TaskActivityLog>().ToTable("TaskActivityLogs");
            modelBuilder.Entity<Notification>().ToTable("Notifications");
            modelBuilder.Entity<JiraSyncLog>().ToTable("JiraSyncLogs");

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

            // TaskTimeLog relations
            modelBuilder.Entity<TaskTimeLog>()
                .HasOne(ttl => ttl.Task)
                .WithMany(t => t.TaskTimeLogs)
                .HasForeignKey(ttl => ttl.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskTimeLog>()
                .HasOne(ttl => ttl.User)
                .WithMany()
                .HasForeignKey(ttl => ttl.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // TaskDependency relations (dual FKs to TaskItem)
            modelBuilder.Entity<TaskDependency>()
                .HasOne(td => td.SourceTask)
                .WithMany(t => t.DependenciesAsSource)
                .HasForeignKey(td => td.SourceTaskId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskDependency>()
                .HasOne(td => td.TargetTask)
                .WithMany(t => t.DependenciesAsTarget)
                .HasForeignKey(td => td.TargetTaskId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TaskDependency>()
                .HasOne(td => td.Creator)
                .WithMany()
                .HasForeignKey(td => td.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);

            // TaskActivityLog relations
            modelBuilder.Entity<TaskActivityLog>()
                .HasOne(tal => tal.Task)
                .WithMany(t => t.TaskActivityLogs)
                .HasForeignKey(tal => tal.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskActivityLog>()
                .HasOne(tal => tal.User)
                .WithMany()
                .HasForeignKey(tal => tal.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification relations
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Task)
                .WithMany()
                .HasForeignKey(n => n.TaskId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Sprint)
                .WithMany()
                .HasForeignKey(n => n.SprintId)
                .OnDelete(DeleteBehavior.SetNull);

            // JiraSyncLog relations
            modelBuilder.Entity<JiraSyncLog>()
                .HasOne(jsl => jsl.TriggeredByUser)
                .WithMany()
                .HasForeignKey(jsl => jsl.TriggeredByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
