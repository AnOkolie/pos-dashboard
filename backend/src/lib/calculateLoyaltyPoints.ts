export const calculateLoyaltyPoints = (totalAmount: number): number => {
  // For every $10 spent, the customer earns 1 loyalty point
  return Math.floor(totalAmount / 10);
};
