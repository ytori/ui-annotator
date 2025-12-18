import type { ComponentProps } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

function Drawer({
	shouldScaleBackground = true,
	...props
}: ComponentProps<typeof DrawerPrimitive.Root>) {
	return (
		<DrawerPrimitive.Root
			shouldScaleBackground={shouldScaleBackground}
			{...props}
		/>
	);
}
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

function DrawerOverlay({
	className,
	...props
}: ComponentProps<typeof DrawerPrimitive.Overlay>) {
	return (
		<DrawerPrimitive.Overlay
			className={cn("fixed inset-0 z-50 bg-black/40", className)}
			{...props}
		/>
	);
}
DrawerOverlay.displayName = "DrawerOverlay";

function DrawerContent({
	className,
	children,
	...props
}: ComponentProps<typeof DrawerPrimitive.Content>) {
	return (
		<DrawerPortal>
			<DrawerOverlay />
			<DrawerPrimitive.Content
				className={cn(
					"fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-xl border bg-background",
					className,
				)}
				{...props}
			>
				<div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted" />
				{children}
			</DrawerPrimitive.Content>
		</DrawerPortal>
	);
}
DrawerContent.displayName = "DrawerContent";

function DrawerHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
			{...props}
		/>
	);
}
DrawerHeader.displayName = "DrawerHeader";

function DrawerFooter({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("mt-auto flex flex-col gap-2 p-4", className)}
			{...props}
		/>
	);
}
DrawerFooter.displayName = "DrawerFooter";

function DrawerTitle({
	className,
	...props
}: ComponentProps<typeof DrawerPrimitive.Title>) {
	return (
		<DrawerPrimitive.Title
			className={cn(
				"text-lg font-semibold leading-none tracking-tight",
				className,
			)}
			{...props}
		/>
	);
}
DrawerTitle.displayName = "DrawerTitle";

function DrawerDescription({
	className,
	...props
}: ComponentProps<typeof DrawerPrimitive.Description>) {
	return (
		<DrawerPrimitive.Description
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
}
DrawerDescription.displayName = "DrawerDescription";

export {
	Drawer,
	DrawerPortal,
	DrawerOverlay,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
	DrawerDescription,
};
