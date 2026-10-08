import { AppError } from '../utils/AppError.js';

export const ALLOWED_TRANSITIONS = {
  open: ['analysis'],
  analysis: ['in_progress'],
  in_progress: ['resolved'],
  resolved: ['closed', 'in_progress'],
  closed: [],
};

export function assertTransition({ from, to, comment }) {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new AppError(409, 'INVALID_STATE', 'Transição não permitida.');
  }
  if (to === 'closed' && !comment?.trim()) {
    throw new AppError(409, 'RESOLUTION_COMMENT_REQUIRED', 'Transição não permitida.');
  }
}
