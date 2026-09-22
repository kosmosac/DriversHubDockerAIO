import { useContext, useEffect, useState } from "react";
import { Alert, CircularProgress, Typography } from "@mui/material";
import { AppContext } from "../../context";

function ExamplePage() {
  const { apiPath } = useContext(AppContext);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    setError(false);
    fetch(`${apiPath}/frontend-plugin-example/message`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setResult)
      .catch(err => {
        if (err.name !== "AbortError") setError(true);
      });
    return () => controller.abort();
  }, [apiPath]);

  return <>
    <Typography variant="h4" gutterBottom>Frontend plugin example</Typography>
    {error && <Alert severity="error">The example backend endpoint is unavailable.</Alert>}
    {!result && !error && <CircularProgress />}
    {result && <Alert severity="success">{result.hub}: {result.message}</Alert>}
  </>;
}

export default {
  id: "frontend-plugin-example",
  routes: [{ path: "/ext/frontend-plugin-example", component: ExamplePage }],
  menu: [{ path: "/ext/frontend-plugin-example", label: "Frontend plugin example" }],
};
