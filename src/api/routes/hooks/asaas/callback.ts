import { Request, Response } from "express";

import { CartService } from "@medusajs/medusa";

export default async (req: Request, res: Response): Promise<void> => {
  console.log("INCOMING CALLBACK");
  const postService: CartService = req.scope.resolve("cartService");

  const cart_id = req.query.cart_id as string;

  console.log("CART ID", cart_id);

  const cart = await postService.retrieve(cart_id, {
    relations: ["payment"],
  });

  console.log("CART", cart);

  if (!cart || !cart.payment || !cart.payment.order_id) {
    console.log("NO CART, PAYMENT OR ORDER ID");

    res.redirect(`${process.env.FRONTEND_URL}/registry/orders`);
    return;
  }

  console.log(
    "REDIRECTING TO",
    `${process.env.FRONTEND_URL}/registry/orders/${cart.payment.order_id}`
  );

  res.redirect(
    `${process.env.FRONTEND_URL}/registry/orders/${cart.payment.order_id}`
  );
};
