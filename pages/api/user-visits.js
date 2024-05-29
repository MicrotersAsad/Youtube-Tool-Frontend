// pages/api/user-visits.js

export default function handler(req, res) {
  const { filter } = req.query;

  // Sample data for user visits
  const userVisits = [
    { date: '2024-05-01', value: 100 },
    { date: '2024-05-02', value: 120 },
    { date: '2024-05-03', value: 150 },
    { date: '2024-05-04', value: 170 },
    { date: '2024-05-05', value: 200 },
    // Add more data points as needed
  ];

  const now = new Date();
  let filteredData;

  const filterData = (data, filter) => {
    switch (filter) {
      case 'daily':
        return data.filter(item => {
          const date = new Date(item.date);
          return date.toDateString() === now.toDateString();
        });
      case 'weekly':
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        return data.filter(item => {
          const date = new Date(item.date);
          return date >= lastWeek && date <= now;
        });
      case 'monthly':
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        return data.filter(item => {
          const date = new Date(item.date);
          return date >= lastMonth && date <= now;
        });
      case 'yearly':
        const lastYear = new Date();
        lastYear.setFullYear(now.getFullYear() - 1);
        return data.filter(item => {
          const date = new Date(item.date);
          return date >= lastYear && date <= now;
        });
      default:
        return data;
    }
  };

  filteredData = filterData(userVisits, filter);
  console.log(`Filtered Data (${filter}):`, filteredData); // Log the filtered data

  res.status(200).json(filteredData);
}
