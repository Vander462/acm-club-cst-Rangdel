import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const requestsFile = path.join(dataDir, "requests.json");
const messagesFile = path.join(dataDir, "messages.json");
const providersFile = path.join(dataDir, "providers.json");
const servicesFile = path.join(dataDir, "services.json");

let requests = [];
let messages = [];
let providers = [];
let services = [];

function loadData() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    if (fs.existsSync(requestsFile)) {
      requests = JSON.parse(fs.readFileSync(requestsFile, "utf8"));
    }
    if (fs.existsSync(messagesFile)) {
      messages = JSON.parse(fs.readFileSync(messagesFile, "utf8"));
    }
    if (fs.existsSync(providersFile)) {
      providers = JSON.parse(fs.readFileSync(providersFile, "utf8"));
    }
    if (fs.existsSync(servicesFile)) {
      services = JSON.parse(fs.readFileSync(servicesFile, "utf8"));
    } else {
      // Initialize with default services
      services = [
        { id: "install-software", name: "Software download", desc: "Get the coding tools, browsers, office apps and other programs you need on your laptop.", price: 50, unit: "per software", icon: "download" },
        { id: "activate-windows", name: "Activate Windows", desc: "Get Windows on your laptop activated so the activation notice and the locked settings go away.", price: 150, unit: "per laptop", icon: "key" },
        { id: "install-windows", name: "Windows installation / downgrade", desc: "Install Windows or move to a supported earlier version, including the necessary drivers.", price: 300, unit: "per laptop", icon: "laptop" },
        { id: "activate-office", name: "Office activation", desc: "Activate Microsoft Office (Word, Excel, PowerPoint) that is already installed on your laptop.", price: 150, unit: "per laptop", icon: "doc" },
      ];
      fs.writeFileSync(servicesFile, JSON.stringify(services, null, 2));
    }
  } catch (error) {
    console.error("Error loading data:", error.message);
    requests = [];
    messages = [];
    providers = [];
    services = [];
  }
}

function saveData() {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
    fs.writeFileSync(providersFile, JSON.stringify(providers, null, 2));
    fs.writeFileSync(servicesFile, JSON.stringify(services, null, 2));
  } catch (error) {
    console.error("Error saving data:", error.message);
  }
}

// Initialize data on first load
loadData();

export function mapRow(r) {
  return {
    id: r.id,
    code: r.code,
    service: r.service,
    serviceName: r.service_name,
    name: r.name,
    studentId: r.student_id,
    phone: r.phone,
    place: r.place,
    preferredDate: r.preferred_date,
    laptopModel: r.laptop_model,
    notes: r.notes,
    details: r.details,
    quantity: r.quantity,
    cost: r.cost,
    status: r.status,
    adminNote: r.admin_note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    confirmedAt: r.confirmed_at,
    incharge: r.incharge || "",
  };
}

export async function listAll() {
  return requests.map(mapRow);
}

export async function getById(id) {
  const r = requests.find((r) => r.id === id);
  return r ? mapRow(r) : null;
}

export async function updateRequest(id, updates) {
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) return null;
  requests[index] = { ...requests[index], ...updates, updated_at: Date.now() };
  saveData();
  return mapRow(requests[index]);
}

// Provider functions
export function mapProviderRow(r) {
  return {
    id: r.id,
    name: r.name,
    department: r.department,
    year: r.year,
    whatsapp: r.whatsapp,
    color: r.color,
    image: r.image || "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listProviders() {
  return providers.map(mapProviderRow);
}

export async function getProviderById(id) {
  const r = providers.find((p) => p.id === id);
  return r ? mapProviderRow(r) : null;
}

export async function createProvider(data) {
  const now = Date.now();
  const newProvider = {
    id: providers.length > 0 ? Math.max(...providers.map((p) => p.id)) + 1 : 1,
    name: data.name,
    department: data.department,
    year: data.year,
    whatsapp: data.whatsapp,
    color: data.color || "#168bb4",
    image: data.image || "",
    created_at: now,
    updated_at: now,
  };
  providers.push(newProvider);
  saveData();
  return mapProviderRow(newProvider);
}

export async function updateProvider(id, data) {
  const index = providers.findIndex((p) => p.id === id);
  if (index === -1) return null;
  providers[index] = {
    ...providers[index],
    ...data,
    color: data.color || providers[index].color,
    updated_at: Date.now(),
  };
  saveData();
  return mapProviderRow(providers[index]);
}

export async function deleteProvider(id) {
  const index = providers.findIndex((p) => p.id === id);
  if (index === -1) return;
  providers.splice(index, 1);
  saveData();
}

// Request functions for API routes
export async function createRequest(data) {
  const now = Date.now();
  const newRequest = {
    id: requests.length > 0 ? Math.max(...requests.map((r) => r.id)) + 1 : 1,
    ...data,
    created_at: now,
    updated_at: now,
    status: data.status || "pending",
  };
  requests.push(newRequest);
  saveData();
  return mapRow(newRequest);
}

export async function getMessages(requestId) {
  return messages.filter((m) => m.request_id === requestId).map((m) => ({
    id: m.id,
    senderRole: m.sender_role,
    senderName: m.sender_name,
    message: m.message,
    createdAt: m.created_at,
  }));
}

export async function addMessage(data) {
  const now = Date.now();
  const newMessage = {
    id: messages.length > 0 ? Math.max(...messages.map((m) => m.id)) + 1 : 1,
    ...data,
    created_at: now,
  };
  messages.push(newMessage);
  saveData();
  return newMessage;
}

// Service functions
export async function listServices() {
  return services;
}

export async function getServiceById(id) {
  return services.find((s) => s.id === id);
}

export async function createService(data) {
  const newService = {
    id: data.id || `service-${Date.now()}`,
    name: data.name,
    desc: data.desc,
    price: Number(data.price) || 0,
    unit: data.unit || "per service",
    icon: data.icon || "▢",
    image: data.image || "",
  };
  services.push(newService);
  saveData();
  return newService;
}

export async function updateService(id, data) {
  const index = services.findIndex((s) => s.id === id);
  if (index === -1) return null;
  services[index] = {
    ...services[index],
    name: data.name,
    desc: data.desc,
    price: Number(data.price) || 0,
    unit: data.unit,
    icon: data.icon,
    image: data.image || "",
  };
  saveData();
  return services[index];
}

export async function deleteService(id) {
  const index = services.findIndex((s) => s.id === id);
  if (index === -1) return;
  services.splice(index, 1);
  saveData();
}
