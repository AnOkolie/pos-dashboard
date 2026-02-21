export const getInventory = async (req, res) => {
  try {
    const { branchId } = req.query;
    if (!branchId) {
      return res.status(400).json({ error: "branchId is required" });
    }

    const inventory = await req.db.inventory.findMany({
      where: { branch_id: parseInt(branchId) },
      include: {
        product: true,
      },
    });

    res.json(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { branchId } = req.query;
    const { productId, quantity } = req.body;

    if (!branchId || !productId || quantity === undefined) {
      return res
        .status(400)
        .json({ error: "branchId, productId, and quantity are required" });
    }

    const inventoryItem = await req.db.inventory.findFirst({
      where: {
        branch_id: parseInt(branchId),
        product_id: parseInt(productId),
      },
    });

    if (inventoryItem) {
      // Update existing inventory
      await req.db.inventory.update({
        where: { id: inventoryItem.id },
        data: { quantity },
      });
    } else {
      // Create new inventory record
      await req.db.inventory.create({
        data: {
          branch_id: parseInt(branchId),
          product_id: parseInt(productId),
          quantity,
        },
      });
    }

    res.json({ message: "Inventory updated successfully" });
  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
