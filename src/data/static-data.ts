import {
  IconDashboard,
  IconTriangleSquareCircle,
  IconUsers,
  IconShoppingCart,
  IconCirclePlus,
  IconPhoto,
  IconPackages,
  IconMessageStar,
} from "@tabler/icons-react";

export const adminNav = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Orders",
      url: "/admin/orders",
      icon: IconShoppingCart,
    },
    {
      title: "Customers",
      url: "/admin/customers",
      icon: IconUsers,
    },
    {
      title: "Staff",
      url: "/admin/staff",
      icon: IconUsers,
    },
    {
      title: "Categories",
      url: "/admin/categories",
      icon: IconTriangleSquareCircle,
    },
  ],
  documents: [
    {
      name: "Add product",
      url: "/admin/add-product",
      icon: IconCirclePlus,
    },
    {
      name: "Media library",
      url: "/admin/product-media",
      icon: IconPhoto,
    },
    {
      name: "All products",
      url: "/admin/product-list",
      icon: IconPackages,
    },
    {
      name: "Catalogue review",
      url: "/admin/product-review",
      icon: IconMessageStar,
    },
  ],
};
