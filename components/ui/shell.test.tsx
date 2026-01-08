import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Shell } from "./shell"

vi.mock("@/components/app-sidebar", () => ({
    AppSidebar: () => <aside data-testid="app-sidebar" />,
}))

vi.mock("@/components/mobile-bottom-nav", () => ({
    MobileBottomNav: () => <nav data-testid="mobile-bottom-nav" />,
}))

describe("Shell", () => {
    it("reserves desktop space for fixed sidebar", () => {
        render(
            <Shell>
                <div>content</div>
            </Shell>
        )

        expect(screen.getByTestId("app-sidebar")).toBeInTheDocument()
        expect(screen.getByTestId("mobile-bottom-nav")).toBeInTheDocument()

        const main = screen.getByRole("main")
        expect(main.className).toContain("md:ml-64")
        expect(main.className).toContain("md:w-[calc(100%-16rem)]")
    })

    it("merges custom classes onto main", () => {
        render(
            <Shell className="bg-red-500">
                <div>content</div>
            </Shell>
        )

        const main = screen.getByRole("main")
        expect(main.className).toContain("bg-red-500")
    })
})
