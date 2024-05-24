const User = require("../model/userModel");
const Order = require("../model/orderModel");
const Product = require("../model/productModel");
const bcrypt = require("bcryptjs");
const puppeteer = require("puppeteer");
const path = require("path");
const ejs = require("ejs");
const fs = require("fs");
const ExcelJS = require("exceljs");

const loginLoad = async (req, res) => {
  try {
    res.render("admin-login");
  } catch (error) {
    console.log(error);
  }
};

const adminLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    if (!email) {
      res.json({ require: true });
    } else {
      if (!password) {
        res.json({ passrequire: true });
      } else {
        if (email.startsWith(" ") || email.includes(" ")) {
          res.json({ emailspace: true });
        } else {
          if (password.startsWith(" ") || password.includes(" ")) {
            res.json({ passwordspace: true });
          } else {
            let emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

            if (!emailPattern.test(req.body.email)) {
              res.json({ emailPatt: true });
            } else {
              const adminData = await User.findOne({ email: email });
              if (adminData) {
                if (adminData.is_admin === 0) {
                  res.json({ emailnot: true });
                } else {
                  const passwordMatch = await bcrypt.compare(
                    password,
                    adminData.password
                  );

                  if (passwordMatch) {
                    console.log("admin password matched");
                    req.session.admin_id = adminData._id;
                    res.json({ success: true });
                  } else {
                    console.log("password incorrect");
                    res.json({ wrongpass: true });
                  }
                }
              } else {
                res.json({ notregister: true });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).render("500");
  }
};

const adminHome = async (req, res) => {
  try {
    const topSellingCategories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $addFields: {
          categoryName: { $arrayElemAt: ["$categoryInfo.name", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          categoryName: 1,
        },
      },
    ]);

    console.log("ca", topSellingCategories);

    const topSellingProducts = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          count: { $sum: "$products.count" },
          name: { $first: "$products.name" },
          image: { $first: { $arrayElemAt: ["$products.image", 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    console.log("asfa", topSellingProducts);

    res.render("admin-home", { topSellingCategories, topSellingProducts });
  } catch (error) {
    console.log(error);
  }
};

const userLoad = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search;
    let query = {};
    if (searchQuery && searchQuery.trim().length >= 1) {
      const sanitizedQuery = searchQuery.trim();
      query.$or = [
        { name: { $regex: sanitizedQuery, $options: "i" } },
        { email: { $regex: sanitizedQuery, $options: "i" } },
      ];
    }

    const totalUsers = await User.countDocuments(query);

    const totalPages = Math.ceil(totalUsers / limit);

    const userData = await User.find(query).skip(skip).limit(limit);

    res.render("userManagment", {
      users: userData,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).render("500");
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.body.userId;
    const blockedUser = await User.findOne({ _id: userId });

    if (blockedUser.is_block == 0) {
      await User.updateOne({ _id: userId }, { $set: { is_block: 1 } });
      res.json({ success: true });
    } else {
      await User.updateOne({ _id: userId }, { $set: { is_block: 0 } });
      res.json({ success: true });
    }
  } catch (error) {
    console.log(error);
    res.status("500").render("500");
  }
};

const orderLoad = async (req, res) => {
  try {
    res.render("order");
  } catch (error) {
    console.log(error);
  }
};

const adminLogout = async (req, res) => {
  try {
    console.log("admin is heere ");
    req.session.admin_id = null;
    console.log(req.session.admin_id, "gyghghhgjhgjhgjhg");
    res.redirect("/admin/login");
  } catch (error) {
    console.log("while logouting the admin", error);
  }
};

const salesReportLoad = async (req, res) => {
  try {
    const date = req.query.date;
    const duration = req.query.sort;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;

    const currentDate = new Date();
    const startDate = new Date(
      currentDate - (duration ? duration * 24 * 60 * 60 * 1000 : 0)
    );

    let orders;
    let totalOrders;
    if (req.query.startDate && req.query.endDate) {
      console.log("heyyyyyy");
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      totalOrders = await Order.countDocuments({
        "products.productStatus": "Delivered",
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      });
      const totalPages = Math.ceil(totalOrders / limit);
      console.log("tot", totalPages, req.query.startDate, req.query.endDate);
      try {
        orders = await Order.aggregate([
          {
            $unwind: "$products",
          },
          {
            $match: {
              "products.productStatus": "Delivered",
              date: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "products.productId",
              foreignField: "_id",
              as: "products.productDetails",
            },
          },
          {
            $addFields: {
              "products.productDetails": {
                $arrayElemAt: ["$products.productDetails", 0],
              },
            },
          },
          {
            $sort: { date: -1 },
          },
          {
            $skip: (page - 1) * limit,
          },
          {
            $limit: limit,
          },
        ]);
      } catch (error) {
        console.error("Aggregation error:", error);
      }
      console.log("ordeee", orders);
      res.render("sales-report", {
        orders,
        date,
        duration,
        totalPages,
        page,
        limit,
      });
    } else if (date && date !== "undefined") {
      const targetDate = new Date(date);

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      totalOrders = await Order.countDocuments({
        "products.productStatus": "Delivered",
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      const totalPages = Math.ceil(totalOrders / limit);
      orders = await Order.aggregate([
        {
          $unwind: "$products",
        },
        {
          $match: {
            "products.productStatus": "Delivered",
            date: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "products.productDetails",
          },
        },
        {
          $addFields: {
            "products.productDetails": {
              $arrayElemAt: ["$products.productDetails", 0],
            },
          },
        },
        {
          $sort: { date: -1 },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
      ]);

      res.render("sales-report", {
        orders,
        date,
        duration,
        totalPages,
        page,
        limit,
      });
    } else {
      totalOrders = await Order.countDocuments({
        "products.productStatus": "Delivered",
        date: { $gte: startDate, $lte: currentDate },
      });
      const totalPages = Math.ceil(totalOrders / limit);

      orders = await Order.aggregate([
        {
          $unwind: "$products",
        },
        {
          $match: {
            "products.productStatus": "Delivered",
            date: { $gte: startDate, $lte: currentDate },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "products.productDetails",
          },
        },
        {
          $addFields: {
            "products.productDetails": {
              $arrayElemAt: ["$products.productDetails", 0],
            },
          },
        },
        {
          $sort: { date: -1 },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
      ]);

      res.render("sales-report", {
        orders,
        totalPages,
        date,
        duration,
        page,
        limit,
      });
    }
  } catch (error) {
    console.log("while loading sales report", error);
    res
      .status(500)
      .send({ message: "An error occurred while loading the sales report." });
  }
};

const pdfDownload = async (req, res) => {
  try {
    const duration = req.query.sort;
    const currentDate = new Date();
    const startDate = new Date(currentDate - duration * 24 * 60 * 60 * 1000);

    const orders = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $match: {
          "products.productStatus": "Delivered",
          date: { $gte: startDate, $lte: currentDate },
        },
      },
      {
        $lookup: {
          from: "Products",
          localField: "products.productId",
          foreignField: "_id",
          as: "products.productDetails",
        },
      },
      {
        $addFields: {
          "products.productDetails": {
            $arrayElemAt: ["$products.productDetails", 0],
          },
        },
      },
      {
        $sort: { date: -1 },
      },
    ]);

    const totalRevenue = orders.reduce((acc, order) => {
      const orderProductsArray = Array.isArray(order.products)
        ? order.products
        : [order.products];
      return (
        acc +
        orderProductsArray.reduce((acc, product) => {
          return (
            acc +
            (product.productStatus === "Delivered" ? product.totalPrice : 0)
          );
        }, 0)
      );
    }, 0);

    const totalDeliveredProductsCount = orders.reduce((acc, order) => {
      const orderProductsArray = Array.isArray(order.products)
        ? order.products
        : [order.products];
      return (
        acc +
        orderProductsArray.reduce((acc, product) => {
          return acc + (product.productStatus === "Delivered" ? 1 : 0);
        }, 0)
      );
    }, 0);

    const ejsPagePath = path.join(__dirname, "../views/admin/report.ejs");
    const ejsPage = await ejs.renderFile(ejsPagePath, {
      orders,
      totalRevenue,
      totalDeliveredProductsCount,
    });
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(ejsPage);
    const pdfBuffer = await page.pdf();
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.log(error.message);
    res.status(500).render("500");
  }
};

const excelDownload = async (req, res) => {
  try {
    const duration = req.query.sort;
    const currentDate = new Date();
    const startDate = new Date(currentDate - duration * 24 * 60 * 60 * 1000);

    const orders = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $match: {
          "products.productStatus": "Delivered", 
          "date": { $gte: startDate, $lte: currentDate }, 
        },
      },
      {
        $lookup: {
          from: "Products",
          localField: "products.productId",
          foreignField: "_id",
          as: "products.productDetails",
        },
      },
      {
        $addFields: {
          "products.productDetails": {
            $arrayElemAt: ["$products.productDetails", 0],
          },
        },
      },
      {
        $sort: { date: -1 },
      },
    ]);
    console.log('excell',orders);
    const totalRevenue = orders.reduce((acc, order) => {
      const orderProductsArray = Array.isArray(order.products)
        ? order.products
        : [order.products];
      return (
        acc +
        orderProductsArray.reduce((acc, product) => {
       
          return (
            acc +
            (product.productStatus && product.productStatus === "Delivered" ? product.totalPrice : 0)
          );
        }, 0)
      );
    }, 0);
    
    const totalDeliveredProductsCount = orders.reduce((acc, order) => {
      const orderProductsArray = Array.isArray(order.products)
        ? order.products
        : [order.products];
      return (
        acc +
        orderProductsArray.reduce((acc, product) => {
        
          return acc + (product.productStatus && product.productStatus === "Delivered" ? 1 : 0);
        }, 0)
      );
    }, 0);
    

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.addRow([
      "Order ID",
      "Billing Name",
      "Date",
      "Total",
      "Payment Method",
      "product name"
    ]);

    orders.forEach((order) => {
      worksheet.addRow([
        order._id,
        order.deliveryDetails.fullName,
        order.date.toISOString().slice(0,10),
        order.totalAmount,
        order.paymentMethod,
        order.products.name,
      ]);
    });

    worksheet.addRow([
      "",
      "",
      "",
      "Total Products:",
      totalDeliveredProductsCount,
    ]);
    worksheet.addRow(["", "", "", "Total Revenue:", totalRevenue]);

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.xlsx"
    );

    res.send(buffer);
  } catch (error) {
    console.log(error.message);
    res.status(500).render("500");
  }
};

const graphData = async (req, res) => {
  try {
    console.log("heeeeiiiiiii", req.body);
    let salesData = {
      labels: [],
      salesData: [],
      revenueData: [],
      productsData: [],
    };

    const { filter, time } = req.body;

    if (filter === "monthly") {
      salesData.labels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const contraints = {
        $gte: new Date(`${time}-01-01T00:00:00.000Z`),
        $lte: new Date(`${time}-12-31T00:00:00.000Z`),
      };
      const sales = await Order.aggregate([
        {
          $match: {
            createdAt: contraints,
          },
        },
        {
          $group: {
            _id: {
              $month: "$createdAt",
            },
            revenueData: {
              $sum: "$totalAmount",
            },
            salesData: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      const products = await Product.aggregate([
        {
          $match: {
            createdAt: contraints,
          },
        },
        {
          $group: {
            _id: {
              $month: "$createdAt",
            },
            productsData: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      sales.forEach((item) => {
        const monthIndex = item._id - 1;
        salesData.salesData[monthIndex] = item.salesData;
        salesData.revenueData[monthIndex] = item.revenueData / 1000;
      });

      products.forEach((item) => {
        const monthIndex = item._id - 1;
        salesData.productsData[monthIndex] = item.productsData;
      });

      console.log("Monthly Data:", salesData);
    } else {
      salesData.labels = [
        `${time - 10}`,
        `${time - 9}`,
        `${time - 8}`,
        `${time - 7}`,
        `${time - 6}`,
        `${time - 5}`,
        `${time - 4}`,
        `${time - 3}`,
        `${time - 2}`,
        `${time - 1}`,
        `${time}`,
      ];
      const contraints = {
        $gte: new Date(`${time - 10}-01-01T00:00:00.000Z`),
        $lte: new Date(`${time}-12-31T00:00:00.000Z`),
      };

      const sales = await Order.aggregate([
        {
          $match: {
            createdAt: contraints,
          },
        },
        {
          $group: {
            _id: {
              $year: "$createdAt",
            },
            revenueData: {
              $sum: "$totalAmount",
            },
            salesData: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      const products = await Product.aggregate([
        {
          $match: {
            createdAt: contraints,
          },
        },
        {
          $group: {
            _id: {
              $year: "$createdAt",
            },
            productsData: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      console.log("slsjlsljl", products, "proddd", sales);

      for (let key of sales) {
        for (let data of salesData.labels) {
          if (key._id == data) {
            salesData.salesData.push(key.salesData);
            salesData.revenueData.push(key.revenueData / 1000);
          } else {
            salesData.salesData.push(0);
            salesData.revenueData.push(0);
          }
        }
      }

      for (let key of products) {
        for (let data of salesData.labels) {
          if (key._id == data) {
            salesData.productsData.push(key.productsData);
          } else {
            salesData.productsData.push(0);
          }
        }
      }
    }
    res.status(200).json(salesData);
  } catch (error) {
    console.log("error", error);
  }
};

module.exports = {
  loginLoad,
  adminLogin,
  adminLogout,
  adminHome,
  userLoad,
  blockUser,
  orderLoad,
  salesReportLoad,
  pdfDownload,
  excelDownload,
  graphData,
};
