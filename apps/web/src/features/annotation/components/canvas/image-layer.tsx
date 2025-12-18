import { Image, Layer } from "react-konva";

interface ImageLayerProps {
	image: HTMLImageElement | null;
	width: number;
	height: number;
}

/**
 * Renders the background image on a Konva Layer.
 * Displays the screenshot/image that annotations are placed on.
 */
export function ImageLayer({ image, width, height }: ImageLayerProps) {
	return (
		<Layer>
			{image && <Image image={image} width={width} height={height} />}
		</Layer>
	);
}
