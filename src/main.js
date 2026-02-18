function validateData(data) {
  if (!data) {
    throw new Error("Данные не предоставлены");
  }

  if (!Array.isArray(data.sellers)) {
    throw new Error("Поле sellers должно быть массивом");
  }
  if (!Array.isArray(data.products)) {
    throw new Error("Поле products должно быть массивом");
  }
  if (!Array.isArray(data.purchase_records)) {
    throw new Error("Поле purchase_records должно быть массивом");
  }

  if (data.sellers.length === 0) {
    throw new Error("Массив sellers не должен быть пустым");
  }
  if (data.products.length === 0) {
    throw new Error("Массив products не должен быть пустым");
  }
  if (data.purchase_records.length === 0) {
    throw new Error("Массив purchase_records не должен быть пустым");
  }
}

/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 *
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  // purchase — это одна из записей в поле items из чека в data.purchase_records
  // _product — это продукт из коллекции data.products
  const { discount, sale_price, quantity } = purchase;

  // Коэффициент для расчета суммы без скидки в десятичном формате
  const discountCoefficient = 1 - discount / 100;

  // Возвращаем выручку
  return sale_price * quantity * discountCoefficient;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  if (index === 0) {
    // Первое место
    return seller.profit * 0.15; // 15% от прибыли
  } else if (index === 1 || index === 2) {
    // Второе и третье место
    return seller.profit * 0.1; // 10% от прибыли
  } else if (index === total - 1) {
    // Последнее место
    return 0; // 0% бонуса
  } else {
    // Все остальные
    return seller.profit * 0.05; // 5% от прибыли
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  validateData(data);

  // @TODO: Проверка наличия опций
  if (typeof options !== "object" || options === null) {
    throw new Error("Чего-то не хватает");
  }

  const { calculateRevenue, calculateBonus } = options;

  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Чего-то не хватает");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((item) => [item.id, item])
  );
  const productIndex = Object.fromEntries(
    data.products.map((item) => [item.sku, item])
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;

    seller.sales_count += 1;

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) return;

      const cost = product.purchase_price * item.quantity;
      const revenue = calculateRevenue(item, product);
      const profit = revenue - cost;

      seller.revenue = seller.revenue + revenue;
      seller.profit = seller.profit + profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
