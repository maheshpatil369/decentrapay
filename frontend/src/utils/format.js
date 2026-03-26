export const shortenAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

export const formatDate = (ts) => {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export const formatEth = (val, d = 4) =>
  parseFloat(val || "0").toFixed(d);

export const classNames = (...classes) =>
  classes.filter(Boolean).join(" ");
