/**
 * Helper to determine if a goal was active on a given date.
 * Under our logic, a daily task only carries over to the next day if it was completed on the previous day.
 * If it was missed/uncompleted on any day since its creation, it stops propagating and is no longer active.
 */
export const isGoalActiveOnDate = (goal: any, date: Date): boolean => {
  const createdDate = new Date(goal.createdAt);
  
  const createdString = `${createdDate.getFullYear()}-${createdDate.getMonth()}-${createdDate.getDate()}`;
  const targetString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  // A goal is only active on the exact day it was created (one-off tasks)
  return createdString === targetString;
};

/**
 * Helper to check if a goal was completed on a target date.
 */
export const isGoalCompletedOnDate = (goal: any, date: Date): boolean => {
  return (goal.logs || []).some(
    (log: any) => new Date(log.completedAt).toDateString() === date.toDateString()
  );
};
