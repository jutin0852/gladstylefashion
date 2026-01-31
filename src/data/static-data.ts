import {
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconHelp,
  IconTriangleSquareCircle,
  IconSearch,
  IconSettings,
  IconUsers,
  IconShoppingCart,
  IconCreditCard,
  IconCirclePlus,
  IconPhoto,
  IconPackages,
  IconMessageStar,
} from "@tabler/icons-react";

export const adminNav = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Order Management",
      url: "/admin/orders",
      icon: IconShoppingCart,
    },
    {
      title: "Customers",
      url: "/admin/customers",
      icon: IconUsers,
    },
    {
      title: "Categories",
      url: "/admin/categories",
      icon: IconTriangleSquareCircle,
    },
    {
      title: "Transactions",
      url: "/admin/transactions",
      icon: IconCreditCard,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Add Products",
      url: "/admin/add-product",
      icon: IconCirclePlus,
    },
    {
      name: "Product Media",
      url: "#",
      icon: IconPhoto,
    },
    {
      name: "Product List",
      url: "/admin/product-list",
      icon: IconPackages,
    },
    {
      name: "Product Review",
      url: "#",
      icon: IconMessageStar,
    },
  ],
};
