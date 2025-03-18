"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Loader, LoadingOverlay } from "@/components/ui/loader";
import { useState } from "react";

export default function UIShowcase() {
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="gradient-heading text-3xl font-bold mb-8">UI Components Showcase</h1>

      <section className="mb-10">
        <h2 className="text-gradient-primary text-2xl font-semibold mb-4">Button Variants</h2>
        <Card>
          <CardHeader>
            <CardTitle>Standard Button Variants</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>New Color Variants</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="info">Info</Button>
            <Button variant="purple">Purple</Button>
            <Button variant="teal">Teal</Button>
            <Button variant="gradient">Gradient</Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>CSS Class Button Styles</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="btn-gradient">Gradient</Button>
            <Button className="btn-success">Success</Button>
            <Button className="btn-warning">Warning</Button>
            <Button className="btn-info">Info</Button>
            <Button className="btn-purple">Purple</Button>
            <Button className="btn-teal">Teal</Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Button Sizes</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            <Button size="sm" variant="default">Small</Button>
            <Button size="default" variant="default">Default</Button>
            <Button size="lg" variant="default">Large</Button>
            <Button size="icon" variant="default">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mb-10">
        <h2 className="text-gradient-accent text-2xl font-semibold mb-4">Text Gradient Styles</h2>
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <div>
              <h3 className="text-gradient-primary text-xl font-bold mb-2">Primary Gradient</h3>
              <p>This text uses the primary color gradient.</p>
            </div>
            <div>
              <h3 className="text-gradient-accent text-xl font-bold mb-2">Accent Gradient</h3>
              <p>This text uses the accent color gradient.</p>
            </div>
            <div>
              <h3 className="text-gradient-primary-accent text-xl font-bold mb-2">Primary to Accent</h3>
              <p>This text transitions from primary to accent color.</p>
            </div>
            <div>
              <h3 className="text-gradient-purple text-xl font-bold mb-2">Purple Gradient</h3>
              <p>This text uses a purple color gradient.</p>
            </div>
            <div>
              <h3 className="text-gradient-teal text-xl font-bold mb-2">Teal Gradient</h3>
              <p>This text uses a teal color gradient.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-10">
        <h2 className="text-gradient-purple text-2xl font-semibold mb-4">Loader Components</h2>
        <Card>
          <CardHeader>
            <CardTitle>Loader Variants</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
            <div className="flex flex-col items-center">
              <Loader size="sm" variant="primary" />
              <p className="mt-2">Small Primary</p>
            </div>
            <div className="flex flex-col items-center">
              <Loader size="md" variant="accent" />
              <p className="mt-2">Medium Accent</p>
            </div>
            <div className="flex flex-col items-center">
              <Loader size="lg" variant="secondary" />
              <p className="mt-2">Large Secondary</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Loading Overlay Example</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingOverlay isLoading={loading}>
              <div className="p-6 border rounded-md">
                <p className="mb-4">This content will be overlaid with a loading indicator when the button below is clicked.</p>
                <Button onClick={simulateLoading} variant="accent">
                  Simulate Loading
                </Button>
              </div>
            </LoadingOverlay>
          </CardContent>
        </Card>
      </section>

      <section className="mb-10">
        <h2 className="text-gradient-teal text-2xl font-semibold mb-4">Card Styles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="feature-card">
            <CardHeader>
              <CardTitle>Feature Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This card uses the feature-card class for styling.</p>
            </CardContent>
          </Card>
          
          <Card className="stats-card">
            <CardHeader>
              <CardTitle>Stats Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This card uses the stats-card class for styling.</p>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Dashboard Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This card uses the dashboard-card class for styling.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
