import prisma from '../../config/prisma.js';

class TrainingRepository {
  /**
   * Find all trainings with optional status, sector, or search filter.
   */
  async findAll(filters = {}) {
    try {
      const where = {};

      if (filters.status && filters.status !== 'all') {
        where.status = filters.status;
      }
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { speaker: { contains: filters.search, mode: 'insensitive' } },
          { speakerOrg: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      return await prisma.training.findMany({
        where,
        include: {
          enrollments: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (err) {
      console.warn('Prisma training query fallback:', err.message);
      return null;
    }
  }

  /**
   * Find a training by ID.
   */
  async findById(id) {
    try {
      return await prisma.training.findUnique({
        where: { id },
        include: {
          enrollments: true
        }
      });
    } catch (err) {
      console.warn('Prisma training findById fallback:', err.message);
      return null;
    }
  }

  /**
   * Create a new training.
   */
  async create(data) {
    return prisma.training.create({
      data,
      include: {
        enrollments: true
      }
    });
  }

  /**
   * Update an existing training by ID.
   */
  async update(id, data) {
    return prisma.training.update({
      where: { id },
      data,
      include: {
        enrollments: true
      }
    });
  }

  /**
   * Delete a training by ID.
   */
  async delete(id) {
    return prisma.training.delete({
      where: { id }
    });
  }

  /**
   * Find an enrollment record for an SME and training.
   */
  async findEnrollment(trainingId, smeId) {
    try {
      return await prisma.trainingEnrollment.findUnique({
        where: {
          trainingId_smeId: {
            trainingId,
            smeId
          }
        }
      });
    } catch (err) {
      return null;
    }
  }

  /**
   * Create or update enrollment for an SME.
   */
  async upsertEnrollment(trainingId, smeId, data = {}) {
    return prisma.trainingEnrollment.upsert({
      where: {
        trainingId_smeId: {
          trainingId,
          smeId
        }
      },
      create: {
        trainingId,
        smeId,
        userId: data.userId || null,
        attended: data.attended ?? false,
        completed: data.completed ?? false,
        hasCertificate: data.hasCertificate ?? false
      },
      update: {
        attended: data.attended !== undefined ? data.attended : undefined,
        completed: data.completed !== undefined ? data.completed : undefined,
        hasCertificate: data.hasCertificate !== undefined ? data.hasCertificate : undefined
      }
    });
  }

  /**
   * Remove enrollment record.
   */
  async deleteEnrollment(trainingId, smeId) {
    try {
      return await prisma.trainingEnrollment.delete({
        where: {
          trainingId_smeId: {
            trainingId,
            smeId
          }
        }
      });
    } catch (err) {
      return null;
    }
  }
}

export default new TrainingRepository();
