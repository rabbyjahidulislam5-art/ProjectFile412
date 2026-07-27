import { prisma } from "../../lib/prisma";
import { writeAuditLog } from "../../lib/audit";
import type { UpdateStudentProfileInput } from "./students.validation";

export async function updateProfile(userId: string, input: UpdateStudentProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { phone: input.phone },
    select: {
      id: true,
      role: true,
      studentId: true,
      employeeId: true,
      fullName: true,
      email: true,
      phone: true,
      department: true,
      batch: true,
      mustResetPassword: true,
      status: true,
      createdAt: true,
    },
  });

  await writeAuditLog({
    actorUserId: userId,
    action: "student.profile.updated",
    entityType: "user",
    entityId: userId,
    metadata: { fields: ["phone"] },
  });

  return { user, message: "Profile updated" };
}
