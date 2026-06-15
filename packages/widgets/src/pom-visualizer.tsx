"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function POMVisualizer({ onMilestone }: { onMilestone?: (m: string) => void }) {
  const [step, setStep] = useState(0);

  const runTest = () => {
    if (step !== 0) return;
    setStep(1); // Test script initiates action
    setTimeout(() => setStep(2), 1500); // Calls POM
    setTimeout(() => setStep(3), 3000); // POM finds element
    setTimeout(() => setStep(4), 4500); // POM performs action
    setTimeout(() => setStep(5), 6000); // Returns to test
    setTimeout(() => {
      setStep(0);
      onMilestone?.("completed-pom-flow");
    }, 7500);
  };

  return (
    <div className="my-8 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 md:p-8 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">Page Object Model (POM)</h3>
          <p className="text-sm text-zinc-400">Separation of Concerns: Test Intent vs DOM Interactions.</p>
          <p className="text-xs text-amber-500/80 mt-1 block md:hidden">📱 Rotate your device for the best view.</p>
        </div>
        <button
          onClick={runTest}
          disabled={step !== 0}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 disabled:opacity-50 disabled:shadow-none"
        >
          {step === 0 ? "Run Test Login" : "Executing..."}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        {/* Test Script Layer */}
        <div className={`relative rounded-xl border-2 p-6 transition-colors duration-500 ${step === 1 || step === 5 ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10" : "border-zinc-800 bg-zinc-950/50"}`}>
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Test Script</span>
            <span className="text-xs text-zinc-500">LoginTest.java</span>
          </div>
          <div className="font-mono text-sm space-y-2">
            <div className="text-zinc-400">@Test</div>
            <div className="text-zinc-400">public void testValidLogin() {"{"}</div>
            <div className={`pl-4 transition-colors duration-300 ${step === 1 ? "text-emerald-300" : "text-zinc-500"}`}>
              LoginPage loginPage = new LoginPage(driver);
            </div>
            <div className={`relative pl-4 transition-colors duration-300 ${step >= 1 && step <= 5 ? "text-emerald-300" : "text-zinc-500"}`}>
              {step > 1 && step < 5 && (
                <motion.div layoutId="highlight" className="absolute -inset-1 rounded bg-emerald-500/20" />
              )}
              <span className="relative z-10">loginPage.login("user", "pass");</span>
            </div>
            <div className={`pl-4 transition-colors duration-300 ${step === 5 ? "text-emerald-300" : "text-zinc-500"}`}>
              Assert.assertTrue(homePage.isDisplayed());
            </div>
            <div className="text-zinc-400">{"}"}</div>
          </div>
        </div>

        {/* Animated Connector Arrow (visible only on MD screens) */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-8 h-8 z-10">
          <AnimatePresence>
            {step > 1 && step < 5 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="text-accent text-2xl"
              >
                ➔
              </motion.div>
            )}
            {step === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-emerald-400 text-2xl"
              >
                ←
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Page Object Layer */}
        <div className={`relative rounded-xl border-2 p-6 transition-colors duration-500 ${step >= 2 && step <= 4 ? "border-accent bg-accent/5 shadow-lg shadow-accent/10" : "border-zinc-800 bg-zinc-950/50"}`}>
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Page Object</span>
            <span className="text-xs text-zinc-500">LoginPage.java</span>
          </div>
          <div className="font-mono text-sm space-y-2">
            <div className={`transition-colors duration-300 ${step === 3 ? "text-accent" : "text-zinc-500"}`}>
              By userField = By.id("username");<br/>
              By passField = By.id("password");<br/>
              By loginBtn = By.id("login-btn");
            </div>
            <br/>
            <div className="text-zinc-400">public void login(String u, String p) {"{"}</div>
            <div className={`pl-4 transition-colors duration-300 ${step >= 3 ? "text-accent" : "text-zinc-500"}`}>
              <div className={step === 4 ? "bg-accent/20 rounded -mx-1 px-1" : ""}>
                driver.findElement(userField).sendKeys(u);<br/>
                driver.findElement(passField).sendKeys(p);<br/>
                driver.findElement(loginBtn).click();
              </div>
            </div>
            <div className="text-zinc-400">{"}"}</div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm font-medium text-zinc-400 min-h-[24px]">
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {step === 0 && "Idle."}
            {step === 1 && "Test Script defines intent: we want to log in."}
            {step === 2 && "Test Script delegates the action to the Page Object."}
            {step === 3 && "Page Object encapsulates the locators."}
            {step === 4 && "Page Object interacts with the WebDriver."}
            {step === 5 && "Action complete. Test Script regains control to assert."}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
