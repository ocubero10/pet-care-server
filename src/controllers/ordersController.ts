import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Order, { IOrder, OrderStatus } from '../models/Order';
import Pet from '../models/Pet';
import { NotFoundError, ValidationError, ForbiddenError, AuthError } from '../utils/errors';
import crypto from 'crypto';

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');

  let query: Record<string, unknown> = {};

  // Filter based on user role
  if (req.user.role === 'owner') {
    query.ownerId = req.user.id;
  } else if (req.user.role === 'driver') {
    query.driverId = req.user.id;
  } else if (req.user.role === 'staff') {
    query.staffId = req.user.id;
  }

  // Status filter
  if (req.query.status) {
    query.status = req.query.status;
  }

  const orders = await Order.find(query)
    .populate('petId')
    .populate('ownerId', 'name email phone')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders,
  });
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const order = await Order.findById(id)
    .populate('petId')
    .populate('ownerId', 'name email phone')
    .populate('driverId', 'name phone')
    .populate('staffId', 'name');

  if (!order) {
    throw new NotFoundError('Order');
  }

  // Check authorization
  const isOwner = order.ownerId._id.toString() === req.user?.id;
  const isDriver = order.driverId?._id.toString() === req.user?.id;
  const isStaff = order.staffId?._id.toString() === req.user?.id;

  if (!isOwner && !isDriver && !isStaff && req.user?.role !== 'staff') {
    throw new ForbiddenError('You cannot view this order');
  }

  res.json({
    success: true,
    data: order,
  });
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AuthError('User not authenticated');
  if (req.user.role !== 'owner') {
    throw new ForbiddenError('Only owners can create orders');
  }

  const { petId, services, requirements, pickupDateTime, estimatedCompletionTime, notes } =
    req.body;

  // Validate required fields
  if (!petId || !services || !pickupDateTime || !estimatedCompletionTime) {
    throw new ValidationError('petId, services, pickupDateTime, and estimatedCompletionTime are required');
  }

  // Check if pet exists and belongs to owner
  const pet = await Pet.findById(petId);
  if (!pet) {
    throw new NotFoundError('Pet');
  }
  if (pet.ownerId.toString() !== req.user.id) {
    throw new ForbiddenError('This pet does not belong to you');
  }

  const order = new Order({
    petId,
    ownerId: req.user.id,
    services,
    requirements: requirements || {},
    pickupDateTime: new Date(pickupDateTime),
    estimatedCompletionTime: new Date(estimatedCompletionTime),
    notes,
  });

  await order.save();

  const populatedOrder = await Order.findById(order._id)
    .populate('petId')
    .populate('ownerId', 'name email phone');

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: populatedOrder,
  });
};

export const updateOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { notes, requirements } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw new NotFoundError('Order');
  }

  // Check authorization
  if (order.ownerId.toString() !== req.user?.id && req.user?.role !== 'staff') {
    throw new ForbiddenError('You cannot update this order');
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    id,
    { notes, requirements },
    { new: true, runValidators: true }
  )
    .populate('petId')
    .populate('ownerId', 'name email phone');

  res.json({
    success: true,
    message: 'Order updated successfully',
    data: updatedOrder,
  });
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body as { status: OrderStatus };

  if (!status) {
    throw new ValidationError('Status is required');
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new NotFoundError('Order');
  }

  // Check authorization based on status transition
  if (status === 'picked_up' && order.driverId?.toString() !== req.user?.id) {
    throw new ForbiddenError('Only assigned driver can mark as picked up');
  }

  if (status === 'delivered' && order.driverId?.toString() !== req.user?.id) {
    throw new ForbiddenError('Only driver can mark as delivered');
  }

  if ((status === 'in_service' || status === 'completed') && order.staffId?.toString() !== req.user?.id && req.user?.role !== 'staff') {
    throw new ForbiddenError('Only assigned staff can update this status');
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'completed') {
    updateData.actualCompletionTime = new Date();
  }

  const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true })
    .populate('petId')
    .populate('ownerId', 'name email phone');

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: updatedOrder,
  });
};

export const assignDriver = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { driverId } = req.body;

  if (!driverId) {
    throw new ValidationError('Driver ID is required');
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new NotFoundError('Order');
  }

  const updatedOrder = await Order.findByIdAndUpdate(id, { driverId }, { new: true })
    .populate('petId')
    .populate('ownerId', 'name email phone');

  res.json({
    success: true,
    message: 'Driver assigned successfully',
    data: updatedOrder,
  });
};

export const requestClarification = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { question } = req.body;

  if (!question) {
    throw new ValidationError('Question is required');
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new NotFoundError('Order');
  }

  if (!order.clarificationRequests) {
    order.clarificationRequests = [];
  }

  order.clarificationRequests.push({
    id: crypto.randomUUID(),
    question,
    askedAt: new Date(),
  });

  await order.save();

  res.json({
    success: true,
    message: 'Clarification requested successfully',
    data: order,
  });
};

export const respondToClarification = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, clarificationId } = req.params;
  const { answer } = req.body;

  if (!answer) {
    throw new ValidationError('Answer is required');
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new NotFoundError('Order');
  }

  const clarification = order.clarificationRequests?.find((c) => c.id === clarificationId);
  if (!clarification) {
    throw new NotFoundError('Clarification request');
  }

  clarification.answer = answer;
  clarification.answeredAt = new Date();

  await order.save();

  res.json({
    success: true,
    message: 'Clarification answered successfully',
    data: order,
  });
};
