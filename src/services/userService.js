import { AppError } from '../utils/AppError.js';

export function createUserService({ userRepository }) {
  async function listUsers({ role }, requester) {
    // Listagem serve à atribuição de responsável (técnico/admin, RF08).
    if (requester.role === 'requester') {
      throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
    }
    return userRepository.listUsers({ role });
  }

  return { listUsers };
}
