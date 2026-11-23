// Shared between index-mysql.js (manual kiosk submissions) and machine-routes.js
// (bottle-machine receipt-code claims) — both are "a transaction actually got
// recorded for this resident", which is the only trigger quest progress needs.
import db from './db-mysql.js';

// Credits progress + bonus points toward every active quest a submission counts
// toward. `bottleCount` is the real metric (no load cell on the machine) —
// `user_task_progress.progressKg` stores a running bottle count here, not kg.
// Simplification: progress accumulates for the life of the quest rather than
// resetting every day/week, so a "daily" quest completes once, not daily.
export async function updateTaskProgressForUser(userId, materialId, bottleCount) {
  try {
    const [tasks] = await db.query(
      "SELECT taskId, target, bonusPoints FROM recycling_tasks WHERE status = 'active' AND (materialId IS NULL OR materialId = ?)",
      [materialId]
    );
    for (const task of tasks) {
      await db.query(
        'INSERT INTO user_task_progress (userId, taskId, progressKg, completed) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE progressKg = progressKg + ?',
        [userId, task.taskId, Number(bottleCount), Number(bottleCount)]
      );
      const [[row]] = await db.query(
        'SELECT progressKg, completed FROM user_task_progress WHERE userId = ? AND taskId = ?',
        [userId, task.taskId]
      );
      const goal = Number(task.target || 0);
      if (row && !row.completed && goal > 0 && Number(row.progressKg) >= goal) {
        await db.query(
          'UPDATE user_task_progress SET completed = 1, completedAt = NOW() WHERE userId = ? AND taskId = ?',
          [userId, task.taskId]
        );
        await db.query('UPDATE users SET pointsBalance = pointsBalance + ? WHERE userId = ?', [Number(task.bonusPoints || 0), userId]);
      }
    }
  } catch (err) {
    console.warn('Quest progress update failed:', err.message);
  }
}
