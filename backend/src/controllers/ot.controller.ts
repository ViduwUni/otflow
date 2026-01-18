import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as OT from "../services/ot.service.js";

export const listSchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    status: z.string().optional(),
    employeeId: z.string().optional(),
    page: z.any().optional(),
    limit: z.any().optional(),
  }),
  body: z.any(),
  params: z.any(),
});

export const bulkCreateSchema = z.object({
  body: z.object({
    workDate: z.string().min(10),
    rows: z.array(
      z.object({
        employeeId: z.string().min(1),
        shift: z.string().min(1),
        inTime: z.string().min(4),
        outTime: z.string().min(4),
        reason: z.string().optional(),
      }),
    ),
  }),
  query: z.any(),
  params: z.any(),
});

export const updateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    shift: z.string().optional(),
    inTime: z.string().optional(),
    outTime: z.string().optional(),
    reason: z.string().optional(),
  }),
  query: z.any(),
});

export const decisionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ reason: z.string().optional() }),
  query: z.any(),
});

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await OT.listOt(req.query);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function pendingCount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await OT.pendingCount();
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function pendingNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const limit = Math.min(Number(req.query.limit ?? 8), 20);
    const data = await OT.getPendingNotifications({ limit });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function bulkCreate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { workDate, rows } = (req as any).parsed.body;

    const result = await OT.createBulk({
      workDate,
      rows,
      actorUserId: req.user!.id,
      meta: {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        route: req.originalUrl,
      },
    });

    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req as any).parsed.params;
    const patch = (req as any).parsed.body;

    const updated = await OT.updateOt({
      id,
      patch,
      actorUserId: req.user!.id,
      meta: { route: req.originalUrl },
    });

    res.json({ ok: true, item: updated });
  } catch (e) {
    next(e);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req as any).parsed.params;
    const { reason } = (req as any).parsed.body;

    const updated = await OT.approveOt({
      id,
      reason,
      actorUserId: req.user!.id,
      meta: { route: req.originalUrl },
    });

    res.json({ ok: true, item: updated });
  } catch (e) {
    next(e);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = (req as any).parsed.params;
    const { reason } = (req as any).parsed.body;

    const updated = await OT.rejectOt({
      id,
      reason,
      actorUserId: req.user!.id,
      meta: { route: req.originalUrl },
    });

    res.json({ ok: true, item: updated });
  } catch (e) {
    next(e);
  }
}

export async function dayStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const date = String(req.query.date);
    const stats = await OT.dayStats(date);
    res.json(stats);
  } catch (e) {
    next(e);
  }
}

export async function weekStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const from = String(req.query.from);
    const to = String(req.query.to);
    const stats = await OT.weekStats(from, to);
    res.json({ items: stats });
  } catch (e) {
    next(e);
  }
}
