const User = require("../model/userModel");
const Order = require("../model/orderModel");
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
    console.log("haloooo");
    res.render("admin-home");
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

    console.log("date", date);
    console.log("duration", duration);
    console.log("req.query", req.query);

    const currentDate = new Date();
    const startDate = new Date(
      currentDate - (duration ? duration * 24 * 60 * 60 * 1000 : 0)
    );
    console.log("startDate", startDate);

    let orders;
    let totalOrders;

    if (date && date !== "undefined") {
      const targetDate = new Date(date);
      console.log("targetdate", targetDate);

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      totalOrders = await Order.countDocuments({
        "products.status": "Delivered",
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });
      
      const totalPages = Math.ceil(totalOrders / limit);

      console.log('totalOrders',totalOrders);
      orders = await Order.aggregate([
        {
          $unwind: "$products",
        },
        {
          $match: {
            "products.status": "Delivered",
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
      const overallDiscount = await Order.aggregate([{$unwind: "$products"},{$match: {"products.status": "Delivered",},},{$group: {_id: null, totalOrderAmount: {$sum: "$totalAmount"}, totalProductTotalPrice: {$sum: "$products.totalPrice"}}}, {$project: {_id: 0, totalOrderAmount: 1, totalProductTotalPrice: 1, totalPriceDifference: {$subtract: ["$totalOrderAmount", "$totalProductTotalPrice"]}}}]);
      console.log('overaal',overallDiscount);
      res.render("sales-report", {orders,date,duration,totalPages,page,limit,overallDiscount:overallDiscount[0].totalPriceDifference,totalAmount:overallDiscount[0].totalOrderAmount});
    } else {
      console.log("herere");

      totalOrders = await Order.countDocuments({
        "products.status": "Delivered",
        date: { $gte: startDate, $lte: currentDate },
      });
      const totalPages = Math.ceil(totalOrders / limit);
    

      orders = await Order.aggregate([
        {
          $unwind: "$products",
        },
        {
          $match: {
            "products.status": "Delivered",
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
  
      const overallDiscount = await Order.aggregate([{$unwind: "$products"},{$match: {"products.status": "Delivered",},},{$group: {_id: null, totalOrderAmount: {$sum: "$totalAmount"}, totalProductTotalPrice: {$sum: "$products.totalPrice"}}}, {$project: {_id: 0, totalOrderAmount: 1, totalProductTotalPrice: 1, totalPriceDifference: {$subtract: ["$totalOrderAmount", "$totalProductTotalPrice"]}}}]);
      res.render("sales-report", {orders,totalPages,date,duration,page,limit,overallDiscount:overallDiscount[0].totalPriceDifference,totalAmount:overallDiscount[0].totalOrderAmount});
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
          "products.status": "Delivered",
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
            acc + (product.status === "Delivered" ? product.totalPrice : 0)
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
          return acc + (product.status === "Delivered" ? 1 : 0);
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
          "products.status": "Delivered",
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
            acc + (product.status === "Delivered" ? product.totalPrice : 0)
          );
        }, 0)
      );
    }, 0);

    const totalDeliveredProductsCount = orders.reduce((acc, order) => {
      const orderProductsArray = Array.isArray(order.orderProducts)
        ? order.orderProducts
        : [order.orderProducts];
      return (
        acc +
        orderProductsArray.reduce((acc, product) => {
          return acc + (product.status === "Delivered" ? 1 : 0);
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
    ]);

    orders.forEach((order) => {
      worksheet.addRow([
        order._id,
        order.deliveryDetails.fullname,
        order.orders,
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
};
