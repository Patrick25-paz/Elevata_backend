import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { ALLOWED_BUSINESS_TYPES } from '../auth/auth.validation.js';

/**
 * A business may pick a type that is either a built-in default or an admin-created
 * category, unless an admin has deactivated it.
 */
export const assertSelectableBusinessType = async (businessType) => {
  const requested = String(businessType || '').trim();
  if (!requested) throw new AppError('Business type is required', 400);
  const row = await prisma.businessCategory.findFirst({
    where: { businessType: { equals: requested, mode: 'insensitive' } }
  });
  if (row) {
    if (row.isActive === false) throw new AppError(`"${requested}" is no longer offered. Choose another category.`, 400);
    return row.businessType;
  }
  const builtIn = ALLOWED_BUSINESS_TYPES.find((t) => t.toLowerCase() === requested.toLowerCase());
  if (builtIn) return builtIn;
  throw new AppError(`Unknown business type "${requested}". Choose one from the category list.`, 400);
};
