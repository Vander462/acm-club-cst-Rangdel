// Shared by the browser and the server. No Node-only imports here.

export const SERVICES = [
  {
    id: "install-software",
    name: "Software download",
    desc: "Get the coding tools, browsers, office apps and other programs you need on your laptop.",
    price: 50,
    unit: "per software",
    icon: "download",
  },
  {
    id: "activate-windows",
    name: "Activate Windows",
    desc: "Get Windows on your laptop activated so the activation notice and the locked settings go away.",
    price: 150,
    unit: "per laptop",
    icon: "key",
  },
  {
    id: "install-windows",
    name: "Windows installation / downgrade",
    desc: "Install Windows or move to a supported earlier version, including the necessary drivers.",
    price: 300,
    unit: "per laptop",
    icon: "laptop",
  },
  {
    id: "activate-office",
    name: "Office activation",
    desc: "Activate Microsoft Office (Word, Excel, PowerPoint) that is already installed on your laptop.",
    price: 150,
    unit: "per laptop",
    icon: "doc",
  },
];

export const VERSIONS = {
  "activate-windows": ["Windows 11", "Windows 10"],
  "install-windows": ["Windows 11", "Windows 10"],
  "activate-office": ["Office 2021", "Office 2019", "Office 2016", "Microsoft 365"],
};

export const STATUS_LABEL = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

export const getService = (id) => SERVICES.find((s) => s.id === id);

export function calcCost(serviceId, quantity) {
  const s = getService(serviceId);
  if (!s) return 0;
  if (serviceId === "install-software") return s.price * (quantity > 0 ? quantity : 0);
  return s.price;
}

export const nu = (n) => "Nu. " + Number(n || 0).toLocaleString("en-US");
