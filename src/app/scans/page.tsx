"use client";

import React, { useState, useEffect, useRef } from "react";
import { Container, Box, Button, Typography, Paper } from "@mui/material";
import { Html5Qrcode } from "html5-qrcode";

export default function ScanPage(): JSX.Element {
  const [scanActive, setScanActive] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const html5QrCodeRef = useRef(null); // Create a ref for the Html5Qrcode instance

  useEffect(() => {
    if (scanActive && !html5QrCodeRef.current) {
      // Initialize Html5Qrcode only once and only when scan is active
      const html5QrCode = new Html5Qrcode("qr-reader"); // Use a fixed ID for the container div
      html5QrCodeRef.current = html5QrCode; // Store the instance in the ref

      html5QrCode.start(
        { facingMode: "environment" }, // Use the rear camera
        {
          fps: 10,
          qrbox: 250 // Use a square QR box
        },
        (decodedText) => {
          setScanResult(decodedText);
          setScanActive(false); // Stop scanning after getting a result
        },
        (errorMessage) => {
          console.error("QR Code Error:");
        }
      ).catch((err) => console.error("Failed to start QR code scanner", err));
    }

    // Cleanup function to stop the QR code scanner
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch((err) => console.error("Failed to stop QR code scanner", err));
      }
    };
  }, [scanActive]);

  const handleScanButtonClick = () => {
    setScanActive(!scanActive);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ my: 4, p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>QR Code Scanner</Typography>
        
        <Box sx={{ my: 2, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Button variant="contained" color={scanActive ? "secondary" : "primary"} onClick={handleScanButtonClick}>
            {scanActive ? "Stop Scanning" : "Start Scanning"}
          </Button>
        </Box>
        
        {/* Container for the QR code scanner */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <div id="qr-reader" style={{ width: "100%" }} />
        </Box>
        
        {scanResult && (
          <Typography variant="body1" sx={{ textAlign: "center" }}>
            Scan Result: {scanResult}
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
