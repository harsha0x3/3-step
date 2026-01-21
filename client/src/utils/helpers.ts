export const dateParser = (data: string) => {
  const date = new Date(data + "Z");
  return date.toLocaleString();
};
