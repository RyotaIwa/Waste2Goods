// Shared between index-mysql.js (manual kiosk submissions) and machine-routes.js
// (bottle-machine receipt-code claims) — both are "a transaction actually got
// recorded for this resident", which is the only trigger quest progress needs.
import db from './db-mysql.js';

// Credits progress + bonus points toward every active quest a submission counts
// toward.
// Simplification: progress accumulates for the life of the quest rather than
// resetting every day/week, so a "daily" quest completes once, not daily.
export async function updateTaskProgressForUser(userId, materialId, weightKg) {
  try {
    const [tasks] = await db.query(
      "SELECT taskId, targetKg, bonusPoints FROM recycling_tasks WHERE status = 'active' AND (materialId IS NULL OR materialId = ?)",
      [materialId]
    );
    for (const task of tasks) {
      await db.query(
        'INSERT INTO user_task_progress (userId, taskId, progressKg, completed) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE progressKg = progressKg + ?',
        [userId, task.taskId, Number(weightKg), Number(weightKg)]
      );
      const [[row]] = await db.query(
        'SELECT progressKg, completed FROM user_task_progress WHERE userId = ? AND taskId = ?',
        [userId, task.taskId]
      );
      const targetKg = Number(task.targetKg || 0);
      if (row && !row.completed && targetKg > 0 && Number(row.progressKg) >= targetKg) {
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
