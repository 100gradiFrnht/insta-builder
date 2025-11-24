import { useState, useRef, useEffect } from 'react';
import { ASPECT_RATIOS, OVERLAY_PATHS } from './utils/constants';
import { transformTextCase } from './utils/textTransform';
import { parseMarkdown } from './utils/markdown';

export default function App() {
            const [aspectRatio, setAspectRatio] = useState('4:5');
            const [baseImage, setBaseImage] = useState(null);
            const [permanentOverlays, setPermanentOverlays] = useState({
                '3:4': null,
                '4:5': null,
                '1:1': null,
                '9:16': null
            });
            const [additionalOverlays, setAdditionalOverlays] = useState({
                'regular-3:4': null,
                'regular-4:5': null,
                'regular-1:1': null,
                'regular-9:16': null,
                'custom-3:4': null,
                'custom-4:5': null,
                'custom-1:1': null,
                'custom-9:16': null
            });
            const [selectedOverlay, setSelectedOverlay] = useState('regular');
            const [textElements, setTextElements] = useState([]);
            const [selectedText, setSelectedText] = useState(null);
            const [textBoxMargin, setTextBoxMargin] = useState(20);

            // Global text formatting settings
            const [globalFontSize, setGlobalFontSize] = useState(40);
            const [globalColor, setGlobalColor] = useState('#ffffff');
            const [globalFontFamily, setGlobalFontFamily] = useState('Helvetica Neue');
            const [globalFontWeight, setGlobalFontWeight] = useState('normal');
            const [globalFontStyle, setGlobalFontStyle] = useState('normal');
            const [globalTextAlign, setGlobalTextAlign] = useState('left');
            const [globalJustify, setGlobalJustify] = useState(false);
            const [globalTextCase, setGlobalTextCase] = useState('default');

            // Tag banner settings (for Custom overlay)
            const [bannerText, setBannerText] = useState('BREAKING');
            const [bannerLetterSpacing, setBannerLetterSpacing] = useState(0.85);
            const [bannerColor, setBannerColor] = useState('#850000');
            const [bannerFontSize, setBannerFontSize] = useState(40);
            const [bannerFontFamily, setBannerFontFamily] = useState('Helvetica Neue');
            const [bannerFontWeight, setBannerFontWeight] = useState('bold');
            const [bannerFontStyle, setBannerFontStyle] = useState('normal');
            const [bannerTextAlign, setBannerTextAlign] = useState('center');
            const [bannerTextCase, setBannerTextCase] = useState('uppercase');
            const [bannerOpacity, setBannerOpacity] = useState(0.6);

            const [imageScale, setImageScale] = useState(1);
            const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
            const [imageRotation, setImageRotation] = useState(0);
            const [isDragging, setIsDragging] = useState(false);
            const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
            const [showMobileControls, setShowMobileControls] = useState(true);
            const [activeTab, setActiveTab] = useState('image');
            const [showSafeMargins, setShowSafeMargins] = useState(false);
            const [lastTouchDistance, setLastTouchDistance] = useState(null);
            const [useBlurBackground, setUseBlurBackground] = useState(false);
            const [blurIntensity, setBlurIntensity] = useState(20);
            const [blurImage, setBlurImage] = useState(null);
            const [useBaseImageForBlur, setUseBaseImageForBlur] = useState(true);
            const [blurImageScale, setBlurImageScale] = useState(1);
            const [blurImagePosition, setBlurImagePosition] = useState({ x: 0, y: 0 });
            const [blurImageRotation, setBlurImageRotation] = useState(0);

            const canvasRef = useRef(null);
            const containerRef = useRef(null);

            // Predefined file paths for permanent overlays
            const PERMANENT_OVERLAY_PATHS = {
                '3:4': './overlays/overlay-3-4.png',
                '4:5': './overlays/overlay-4-5.png',
                '1:1': './overlays/overlay-1-1.png',
                '9:16': './overlays/overlay-9-16.png'
            };

            // Predefined file paths for additional overlays (one for each aspect ratio)
            const ADDITIONAL_OVERLAY_PATHS = {
                'regular-3:4': './overlays/regular-overlay-3-4.png',
                'regular-4:5': './overlays/regular-overlay-4-5.png',
                'regular-1:1': './overlays/regular-overlay-1-1.png',
                'regular-9:16': './overlays/regular-overlay-9-16.png',
                'custom-3:4': './overlays/custom-overlay-3-4.png',
                'custom-4:5': './overlays/custom-overlay-4-5.png',
                'custom-1:1': './overlays/custom-overlay-1-1.png',
                'custom-9:16': './overlays/custom-overlay-9-16.png'
            };

            const dimensions = ASPECT_RATIOS[aspectRatio];
            const maxCanvasWidth = typeof window !== 'undefined' ? Math.min(600, window.innerWidth - 40) : 600;
            const scale = maxCanvasWidth / dimensions.width;
            const canvasHeight = dimensions.height * scale;

            // Load permanent overlays from predefined paths on mount
            useEffect(() => {
                // Load permanent overlays
                Object.entries(PERMANENT_OVERLAY_PATHS).forEach(([ratio, path]) => {
                    fetch(path)
                        .then(response => response.blob())
                        .then(blob => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const img = new Image();
                                img.onload = () => {
                                    console.log(`Loaded permanent overlay for ${ratio}`);
                                    setPermanentOverlays(prev => ({
                                        ...prev,
                                        [ratio]: img
                                    }));
                                };
                                img.src = e.target.result;
                            };
                            reader.readAsDataURL(blob);
                        })
                        .catch(e => {
                            console.error(`Failed to load permanent overlay for ${ratio} from ${path}`, e);
                        });
                });

                // Load additional overlays
                Object.entries(ADDITIONAL_OVERLAY_PATHS).forEach(([type, path]) => {
                    fetch(path)
                        .then(response => response.blob())
                        .then(blob => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const img = new Image();
                                img.onload = () => {
                                    console.log(`Loaded additional overlay for ${type}`);
                                    setAdditionalOverlays(prev => ({
                                        ...prev,
                                        [type]: img
                                    }));
                                };
                                img.src = e.target.result;
                            };
                            reader.readAsDataURL(blob);
                        })
                        .catch(e => {
                            console.error(`Failed to load additional overlay for ${type} from ${path}`, e);
                        });
                });
            }, []);

            const handleBaseImageUpload = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            setBaseImage(img);
                            setImageScale(1);
                            setImagePosition({ x: 0, y: 0 });
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };

            const handleBlurImageUpload = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            setBlurImage(img);
                            setBlurImageScale(1);
                            setBlurImagePosition({ x: 0, y: 0 });
                            setBlurImageRotation(0);
                            setUseBaseImageForBlur(false);
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            };

            const addText = () => {
                const bottomMargin = aspectRatio === '9:16' ? 100 : 25;
                const yPosition = dimensions.height - bottomMargin;

                setTextElements(prev => [...prev, {
                    id: Date.now(),
                    text: 'Your text here',
                    x: dimensions.width / 2,
                    y: yPosition,
                    useCustomSettings: false,
                    fontSize: 40,
                    color: '#ffffff',
                    fontFamily: 'Helvetica Neue',
                    fontWeight: 'normal',
                    fontStyle: 'normal',
                    textAlign: 'left',
                    textCase: 'default',
                    justify: false,
                    maxWidth: dimensions.width - 100
                }]);
            };

            const updateTextElement = (id, updates) => {
                setTextElements(prev => prev.map(el => 
                    el.id === id ? { ...el, ...updates } : el
                ));
            };

            const deleteTextElement = (id) => {
                setTextElements(prev => prev.filter(el => el.id !== id));
                if (selectedText === id) setSelectedText(null);
            };

            const moveTextElementUp = (index) => {
                if (index === 0) return; // Already at the top
                setTextElements(prev => {
                    const newArray = [...prev];
                    [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
                    return newArray;
                });
            };

            const moveTextElementDown = (index) => {
                if (index === textElements.length - 1) return; // Already at the bottom
                setTextElements(prev => {
                    const newArray = [...prev];
                    [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
                    return newArray;
                });
            };

            const getTouchDistance = (touches) => {
                const dx = touches[0].clientX - touches[1].clientX;
                const dy = touches[0].clientY - touches[1].clientY;
                return Math.sqrt(dx * dx + dy * dy);
            };

            const handleImageDragStart = (e) => {
                // Handle pinch zoom - detect two fingers
                if (e.touches && e.touches.length === 2) {
                    e.preventDefault();
                    const distance = getTouchDistance(e.touches);
                    setLastTouchDistance(distance);
                    setIsDragging(false); // Don't drag when pinching
                    return;
                }

                // Handle single touch/mouse drag only if not already pinching
                if (e.touches && e.touches.length > 2) return;

                e.preventDefault();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                setIsDragging(true);
                setDragStart({ x: clientX - imagePosition.x, y: clientY - imagePosition.y });
                setLastTouchDistance(null); // Reset pinch state
            };

            const handleImageDragMove = (e) => {
                // Handle pinch zoom - two fingers
                if (e.touches && e.touches.length === 2) {
                    e.preventDefault();
                    const distance = getTouchDistance(e.touches);

                    if (lastTouchDistance && lastTouchDistance > 0) {
                        // Calculate scale change
                        const ratio = distance / lastTouchDistance;

                        // Apply gentle smoothing
                        const smoothRatio = 1 + (ratio - 1) * 0.8;

                        const newScale = imageScale * smoothRatio;
                        const clampedScale = Math.max(0.5, Math.min(3, newScale));

                        setImageScale(clampedScale);
                    }

                    setLastTouchDistance(distance);

                    setIsDragging(false); // Ensure dragging is off while pinching
                    return;
                }

                // Handle single touch/mouse drag
                if (!isDragging || (e.touches && e.touches.length !== 1)) return;

                e.preventDefault();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                setImagePosition({
                    x: clientX - dragStart.x,
                    y: clientY - dragStart.y
                });
            };

            const handleImageDragEnd = (e) => {
                // If there are still touches, check if we should continue pinching
                if (e.touches && e.touches.length === 2) {
                    const distance = getTouchDistance(e.touches);
                    setLastTouchDistance(distance);
                    return;
                }

                setIsDragging(false);
                setLastTouchDistance(null);
            };

            useEffect(() => {
                if (isDragging || lastTouchDistance !== null) {
                    window.addEventListener('mousemove', handleImageDragMove);
                    window.addEventListener('mouseup', handleImageDragEnd);
                    window.addEventListener('touchmove', handleImageDragMove, { passive: false });
                    window.addEventListener('touchend', handleImageDragEnd);
                    return () => {
                        window.removeEventListener('mousemove', handleImageDragMove);
                        window.removeEventListener('mouseup', handleImageDragEnd);
                        window.removeEventListener('touchmove', handleImageDragMove);
                        window.removeEventListener('touchend', handleImageDragEnd);
                    };
                }
            }, [isDragging, dragStart, lastTouchDistance]);

            const renderCanvas = (includeSafeMargins = true) => {
                const canvas = canvasRef.current;
                if (!canvas) return;

                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, dimensions.width, dimensions.height);

                // Draw blurred background if enabled
                if (useBlurBackground) {
                    const blurSourceImage = useBaseImageForBlur ? baseImage : blurImage;

                    if (blurSourceImage) {
                        ctx.save();

                        // Center point of canvas
                        const centerX = dimensions.width / 2;
                        const centerY = dimensions.height / 2;

                        // Apply blur image position offset (scaled to canvas coordinates)
                        const blurImgX = blurImagePosition.x / scale;
                        const blurImgY = blurImagePosition.y / scale;

                        // Move to center + offset
                        ctx.translate(centerX + blurImgX, centerY + blurImgY);

                        // Apply rotation around the center
                        ctx.rotate((blurImageRotation * Math.PI) / 180);

                        // Apply zoom
                        ctx.scale(blurImageScale, blurImageScale);

                        // Calculate blur image dimensions to fill canvas (crop, not stretch)
                        const blurImgAspect = blurSourceImage.width / blurSourceImage.height;
                        const canvasAspect = dimensions.width / dimensions.height;

                        let blurDrawWidth = dimensions.width;
                        let blurDrawHeight = dimensions.height;

                        if (blurImgAspect > canvasAspect) {
                            blurDrawWidth = dimensions.height * blurImgAspect;
                            blurDrawHeight = dimensions.height;
                        } else {
                            blurDrawWidth = dimensions.width;
                            blurDrawHeight = dimensions.width / blurImgAspect;
                        }

                        // Apply CSS filter blur
                        ctx.filter = `blur(${blurIntensity}px)`;
                        ctx.drawImage(blurSourceImage, -blurDrawWidth / 2, -blurDrawHeight / 2, blurDrawWidth, blurDrawHeight);
                        ctx.filter = 'none';

                        ctx.restore();
                    }
                }

                // Draw base image
                if (baseImage) {
                    // Calculate image dimensions to fill canvas
                    const imgAspect = baseImage.width / baseImage.height;
                    const canvasAspect = dimensions.width / dimensions.height;

                    let drawWidth = dimensions.width;
                    let drawHeight = dimensions.height;

                    if (imgAspect > canvasAspect) {
                        drawWidth = dimensions.height * imgAspect;
                        drawHeight = dimensions.height;
                    } else {
                        drawWidth = dimensions.width;
                        drawHeight = dimensions.width / imgAspect;
                    }

                    // Draw main image with transformations
                    ctx.save();

                    // Center point of canvas
                    const centerX = dimensions.width / 2;
                    const centerY = dimensions.height / 2;

                    // Apply position offset (scaled to canvas coordinates)
                    const imgX = imagePosition.x / scale;
                    const imgY = imagePosition.y / scale;

                    // Move to center + offset
                    ctx.translate(centerX + imgX, centerY + imgY);

                    // Apply rotation around the center
                    ctx.rotate((imageRotation * Math.PI) / 180);

                    // Apply zoom
                    ctx.scale(imageScale, imageScale);

                    // Draw image centered at origin (which is now at centerX + offset)
                    ctx.drawImage(baseImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

                    ctx.restore();
                }

                // Draw selected additional overlay for current aspect ratio (skip if 'regular')
                if (selectedOverlay !== 'regular') {
                    const overlayKey = `${selectedOverlay}-${aspectRatio}`;
                    const currentAdditionalOverlay = additionalOverlays[overlayKey];
                    if (currentAdditionalOverlay) {
                        ctx.drawImage(currentAdditionalOverlay, 0, 0, dimensions.width, dimensions.height);
                    }
                }

                // Draw permanent overlay for current aspect ratio (always on top)
                const currentPermanentOverlay = permanentOverlays[aspectRatio];
                if (currentPermanentOverlay) {
                    ctx.drawImage(currentPermanentOverlay, 0, 0, dimensions.width, dimensions.height);
                }

                // Draw 3:4 safe area centered on all aspect ratios if enabled (only for display, not export)
                if (showSafeMargins && includeSafeMargins) {
                    ctx.save();

                    // 3:4 safe area (1080x1440) - centered on the canvas
                    // Scale to fit within canvas if necessary
                    const targetRatio = 3 / 4; // width/height for 3:4
                    const canvasRatio = dimensions.width / dimensions.height;

                    let safeWidth, safeHeight, marginLeft, marginTop;

                    if (canvasRatio > targetRatio) {
                        // Canvas is wider than 3:4, fit by height
                        safeHeight = dimensions.height;
                        safeWidth = safeHeight * targetRatio;
                        marginLeft = (dimensions.width - safeWidth) / 2;
                        marginTop = 0;
                    } else {
                        // Canvas is taller than 3:4, fit by width
                        safeWidth = dimensions.width;
                        safeHeight = safeWidth / targetRatio;
                        marginLeft = 0;
                        marginTop = (dimensions.height - safeHeight) / 2;
                    }

                    // Draw semi-transparent black overlay on areas outside safe area
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

                    // Top area (if any)
                    if (marginTop > 0) {
                        ctx.fillRect(0, 0, dimensions.width, marginTop);
                    }

                    // Bottom area (if any)
                    if (marginTop + safeHeight < dimensions.height) {
                        ctx.fillRect(0, marginTop + safeHeight, dimensions.width, dimensions.height - (marginTop + safeHeight));
                    }

                    // Left area (if any)
                    if (marginLeft > 0) {
                        ctx.fillRect(0, 0, marginLeft, dimensions.height);
                    }

                    // Right area (if any)
                    if (marginLeft + safeWidth < dimensions.width) {
                        ctx.fillRect(marginLeft + safeWidth, 0, dimensions.width - (marginLeft + safeWidth), dimensions.height);
                    }

                    // Draw red dashed border around safe area
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([10, 5]);
                    ctx.strokeRect(marginLeft, marginTop, safeWidth, safeHeight);

                    // Add label with background for better visibility
                    ctx.setLineDash([]);
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const labelText = '3:4 Safe Area';
                    const textMetrics = ctx.measureText(labelText);
                    const textWidth = textMetrics.width;
                    const textHeight = 24; // font size
                    const padding = 8;

                    // Calculate label position (center of background box)
                    const labelY = marginTop > 30 ? marginTop - 20 : marginTop + 20;

                    // Draw background rectangle
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(
                        dimensions.width / 2 - textWidth / 2 - padding,
                        labelY - textHeight / 2 - padding,
                        textWidth + padding * 2,
                        textHeight + padding * 2
                    );

                    // Draw white text on top (centered in the box)
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(labelText, dimensions.width / 2, labelY);

                    ctx.restore();
                }

                // Draw text elements (calculate positions from bottom to top with margins)
                const bottomMargin = aspectRatio === '9:16' ? 100 : 25;
                const isCustomOverlay = selectedOverlay === 'custom';
                let currentBottomY = dimensions.height - bottomMargin;
                const textBoxHeights = [];

                // First pass: calculate all text box heights
                textElements.forEach((el, index) => {
                    // Use global settings if not using custom settings
                    const fontSize = el.useCustomSettings ? (el.fontSize || 40) : globalFontSize;
                    const fontFamily = el.useCustomSettings ? (el.fontFamily || 'Helvetica Neue') : globalFontFamily;
                    const fontStyle = el.useCustomSettings ? (el.fontStyle || 'normal') : globalFontStyle;
                    const fontWeight = el.useCustomSettings ? (el.fontWeight || 'normal') : globalFontWeight;
                    const textCase = el.useCustomSettings ? (el.textCase || 'default') : globalTextCase;

                    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                    const lineHeight = fontSize * 1.2;
                    const paddingVertical = 40;

                    const transformTextCase = (text, textCase) => {
                        if (!textCase || textCase === 'default') return text;
                        switch (textCase) {
                            case 'uppercase': return text.toUpperCase();
                            case 'lowercase': return text.toLowerCase();
                            case 'capitalize': return text.replace(/\b\w/g, l => l.toUpperCase());
                            default: return text;
                        }
                    };

                    const transformedText = transformTextCase(el.text, textCase);
                    const textMargin = 30;
                    const availableTextWidth = 965 - (textMargin * 2);

                    const wrapText = (text, maxWidth) => {
                        const paragraphs = text.split('\n');
                        const allLines = [];
                        paragraphs.forEach(paragraph => {
                            if (paragraph.trim() === '') {
                                allLines.push('');
                                return;
                            }
                            const words = paragraph.split(' ');
                            let currentLine = '';
                            words.forEach(word => {
                                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                                const metrics = ctx.measureText(testLine);
                                if (metrics.width > maxWidth && currentLine !== '') {
                                    allLines.push(currentLine);
                                    currentLine = word;
                                } else {
                                    currentLine = testLine;
                                }
                            });
                            if (currentLine) {
                                allLines.push(currentLine);
                            }
                        });
                        return allLines;
                    };

                    const lines = wrapText(transformedText, availableTextWidth);
                    const totalTextHeight = lines.length * lineHeight;
                    const rectHeight = totalTextHeight + paddingVertical * 2;

                    textBoxHeights.push({
                        height: rectHeight,
                        marginBottom: textBoxMargin
                    });
                });

                // Second pass: render text elements from bottom to top
                textElements.forEach((el, index) => {
                    // Use global settings if not using custom settings
                    const fontSize = el.useCustomSettings ? (el.fontSize || 40) : globalFontSize;
                    const fontFamily = el.useCustomSettings ? (el.fontFamily || 'Helvetica Neue') : globalFontFamily;
                    const fontStyle = el.useCustomSettings ? (el.fontStyle || 'normal') : globalFontStyle;
                    const fontWeight = el.useCustomSettings ? (el.fontWeight || 'normal') : globalFontWeight;
                    const textCase = el.useCustomSettings ? (el.textCase || 'default') : globalTextCase;
                    const textAlign = el.useCustomSettings ? (el.textAlign || 'left') : globalTextAlign;
                    const justify = el.useCustomSettings ? (el.justify || false) : globalJustify;
                    const color = el.useCustomSettings ? (el.color || '#ffffff') : globalColor;

                    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                    const maxWidth = el.maxWidth || dimensions.width - 100;
                    const lineHeight = fontSize * 1.2;
                    const paddingVertical = 40; // Top and bottom padding
                    const paddingHorizontal = 20; // Left and right padding (for the box itself)
                    const textMargin = 30; // Margin inside the textbox for text

                    // Text case transformation function
                    const transformTextCase = (text, textCase) => {
                        if (!textCase || textCase === 'default') return text;

                        switch (textCase) {
                            case 'uppercase':
                                return text.toUpperCase();
                            case 'lowercase':
                                return text.toLowerCase();
                            case 'titlecase':
                                return text.replace(/\w\S*/g, (word) =>
                                    word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
                                );
                            case 'sentencecase':
                                return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
                            default:
                                return text;
                        }
                    };

                    // Apply text case transformation
                    const transformedText = transformTextCase(el.text, textCase);

                    // Parse markdown syntax
                    const parseMarkdown = (text) => {
                        const segments = [];
                        let remaining = text;

                        while (remaining.length > 0) {
                            // Try to match ***text*** (bold italic)
                            let match = remaining.match(/^\*\*\*(.+?)\*\*\*/);
                            if (match) {
                                segments.push({ text: match[1], bold: true, italic: true });
                                remaining = remaining.substring(match[0].length);
                                continue;
                            }

                            // Try to match **text** (bold)
                            match = remaining.match(/^\*\*(.+?)\*\*/);
                            if (match) {
                                segments.push({ text: match[1], bold: true, italic: false });
                                remaining = remaining.substring(match[0].length);
                                continue;
                            }

                            // Try to match *text* (italic)
                            match = remaining.match(/^\*(.+?)\*/);
                            if (match) {
                                segments.push({ text: match[1], bold: false, italic: true });
                                remaining = remaining.substring(match[0].length);
                                continue;
                            }

                            // No match - take one character as plain text
                            const nextAsterisk = remaining.substring(1).search(/\*/);
                            const plainText = nextAsterisk === -1
                                ? remaining
                                : remaining.substring(0, nextAsterisk + 1);

                            segments.push({ text: plainText, bold: false, italic: false });
                            remaining = remaining.substring(plainText.length);
                        }

                        return segments.length > 0 ? segments : [{ text, bold: false, italic: false }];
                    };

                    const wrapText = (text, maxWidth) => {
                        // First split by manual line breaks
                        const paragraphs = text.split('\n');
                        const allLines = [];

                        paragraphs.forEach(paragraph => {
                            // Handle empty lines (preserve line breaks)
                            if (paragraph.trim() === '') {
                                allLines.push('');
                                return;
                            }

                            // Simple word-based wrapping
                            const words = paragraph.split(' ');
                            let currentLine = '';

                            words.forEach(word => {
                                const testLine = currentLine + (currentLine ? ' ' : '') + word;

                                // Measure with current font
                                ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                                const metrics = ctx.measureText(testLine);

                                if (metrics.width > maxWidth && currentLine !== '') {
                                    allLines.push(currentLine);
                                    currentLine = word;
                                } else {
                                    currentLine = testLine;
                                }
                            });

                            if (currentLine) {
                                allLines.push(currentLine);
                            }
                        });

                        return allLines;
                    };

                    // Calculate available width for text (textbox width minus margins)
                    const availableTextWidth = 965 - (textMargin * 2);
                    const lines = wrapText(transformedText, availableTextWidth);

                    // Calculate text block dimensions
                    const totalTextHeight = lines.length * lineHeight;

                    // Set fixed width to 965px
                    let textBoxWidth = 965;

                    // Rectangle dimensions
                    const rectHeight = totalTextHeight + paddingVertical * 2;

                    // Calculate stacked position from bottom to top
                    const rectX = dimensions.width / 2 - textBoxWidth / 2;
                    const rectY = currentBottomY - rectHeight;

                    // Update currentBottomY for next textbox (add margin)
                    currentBottomY = rectY - textBoxMargin;

                    // Draw rectangle with gradient background and rounded corners
                    ctx.save();

                    const borderRadius = 50;

                    // Create gradient (top to bottom: 55% transparent to black)
                    const gradient = ctx.createLinearGradient(rectX, rectY, rectX, rectY + rectHeight);
                    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 1.0)');

                    // Draw filled rounded rectangle with gradient
                    ctx.fillStyle = gradient;
                    ctx.beginPath();

                    if (isCustomOverlay) {
                        // Square top corners, rounded bottom corners
                        ctx.moveTo(rectX, rectY);
                        ctx.lineTo(rectX + textBoxWidth, rectY);
                        ctx.lineTo(rectX + textBoxWidth, rectY + rectHeight - borderRadius);
                        ctx.arcTo(rectX + textBoxWidth, rectY + rectHeight, rectX + textBoxWidth - borderRadius, rectY + rectHeight, borderRadius);
                        ctx.lineTo(rectX + borderRadius, rectY + rectHeight);
                        ctx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius, borderRadius);
                        ctx.lineTo(rectX, rectY);
                    } else {
                        // All corners rounded
                        ctx.moveTo(rectX + borderRadius, rectY);
                        ctx.lineTo(rectX + textBoxWidth - borderRadius, rectY);
                        ctx.arcTo(rectX + textBoxWidth, rectY, rectX + textBoxWidth, rectY + borderRadius, borderRadius);
                        ctx.lineTo(rectX + textBoxWidth, rectY + rectHeight - borderRadius);
                        ctx.arcTo(rectX + textBoxWidth, rectY + rectHeight, rectX + textBoxWidth - borderRadius, rectY + rectHeight, borderRadius);
                        ctx.lineTo(rectX + borderRadius, rectY + rectHeight);
                        ctx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius, borderRadius);
                        ctx.lineTo(rectX, rectY + borderRadius);
                        ctx.arcTo(rectX, rectY, rectX + borderRadius, rectY, borderRadius);
                    }

                    ctx.closePath();
                    ctx.fill();

                    // Draw white inside stroke (2px) with rounded corners
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    const strokeInset = 1;
                    const innerRadius = borderRadius - strokeInset;
                    ctx.beginPath();

                    if (isCustomOverlay) {
                        // Square top corners, rounded bottom corners
                        ctx.moveTo(rectX + strokeInset, rectY + strokeInset);
                        ctx.lineTo(rectX + textBoxWidth - strokeInset, rectY + strokeInset);
                        ctx.lineTo(rectX + textBoxWidth - strokeInset, rectY + rectHeight - strokeInset - innerRadius);
                        ctx.arcTo(rectX + textBoxWidth - strokeInset, rectY + rectHeight - strokeInset, rectX + textBoxWidth - strokeInset - innerRadius, rectY + rectHeight - strokeInset, innerRadius);
                        ctx.lineTo(rectX + strokeInset + innerRadius, rectY + rectHeight - strokeInset);
                        ctx.arcTo(rectX + strokeInset, rectY + rectHeight - strokeInset, rectX + strokeInset, rectY + rectHeight - strokeInset - innerRadius, innerRadius);
                        ctx.lineTo(rectX + strokeInset, rectY + strokeInset);
                    } else {
                        // All corners rounded
                        ctx.moveTo(rectX + strokeInset + innerRadius, rectY + strokeInset);
                        ctx.lineTo(rectX + textBoxWidth - strokeInset - innerRadius, rectY + strokeInset);
                        ctx.arcTo(rectX + textBoxWidth - strokeInset, rectY + strokeInset, rectX + textBoxWidth - strokeInset, rectY + strokeInset + innerRadius, innerRadius);
                        ctx.lineTo(rectX + textBoxWidth - strokeInset, rectY + rectHeight - strokeInset - innerRadius);
                        ctx.arcTo(rectX + textBoxWidth - strokeInset, rectY + rectHeight - strokeInset, rectX + textBoxWidth - strokeInset - innerRadius, rectY + rectHeight - strokeInset, innerRadius);
                        ctx.lineTo(rectX + strokeInset + innerRadius, rectY + rectHeight - strokeInset);
                        ctx.arcTo(rectX + strokeInset, rectY + rectHeight - strokeInset, rectX + strokeInset, rectY + rectHeight - strokeInset - innerRadius, innerRadius);
                        ctx.lineTo(rectX + strokeInset, rectY + strokeInset + innerRadius);
                        ctx.arcTo(rectX + strokeInset, rectY + strokeInset, rectX + strokeInset + innerRadius, rectY + strokeInset, innerRadius);
                    }

                    ctx.closePath();
                    ctx.stroke();

                    ctx.restore();

                    // Draw text on top
                    ctx.fillStyle = color;
                    ctx.textBaseline = 'top';

                    // Calculate starting Y position for text (with padding)
                    const textStartY = rectY + paddingVertical;

                    // Draw lines from top to bottom with markdown support
                    lines.forEach((line, i) => {
                        const lineY = textStartY + (i * lineHeight);
                        const segments = parseMarkdown(line);

                        // Calculate total line width for alignment
                        let totalLineWidth = 0;
                        segments.forEach(seg => {
                            const segWeight = seg.bold ? 'bold' : fontWeight;
                            const segStyle = seg.italic ? 'italic' : fontStyle;
                            ctx.font = `${segStyle} ${segWeight} ${fontSize}px ${fontFamily}`;
                            totalLineWidth += ctx.measureText(seg.text).width;
                        });

                        // Calculate starting X based on alignment
                        let startX;
                        if (textAlign === 'center') {
                            startX = rectX + textBoxWidth / 2 - totalLineWidth / 2;
                        } else if (textAlign === 'right') {
                            startX = rectX + textBoxWidth - textMargin - totalLineWidth;
                        } else {
                            startX = rectX + textMargin;
                        }

                        // Draw each segment with its styling
                        let currentX = startX;
                        segments.forEach(seg => {
                            const segWeight = seg.bold ? 'bold' : fontWeight;
                            const segStyle = seg.italic ? 'italic' : fontStyle;
                            ctx.font = `${segStyle} ${segWeight} ${fontSize}px ${fontFamily}`;
                            ctx.textAlign = 'left';
                            ctx.fillText(seg.text, currentX, lineY);
                            currentX += ctx.measureText(seg.text).width;
                        });
                    });
                });

                // Draw tag banner on top of the topmost textbox (when Custom overlay is selected)
                if (isCustomOverlay && textElements.length > 0) {
                    // Get the topmost textbox position (last one rendered)
                    const topmostIndex = textElements.length - 1;

                    // Calculate the position from the textBoxHeights
                    let bannerY = dimensions.height - bottomMargin;
                    for (let i = 0; i < textElements.length; i++) {
                        bannerY -= textBoxHeights[i].height;
                        if (i < textElements.length - 1) {
                            bannerY -= textBoxMargin;
                        }
                    }

                    const bannerWidth = 965;
                    const bannerHeight = 89;
                    const bannerX = dimensions.width / 2 - bannerWidth / 2;
                    const bannerTopY = bannerY - bannerHeight;

                    // Draw banner rectangle with color fill and rounded top corners
                    ctx.save();
                    const bannerTopRadius = 35.5;

                    // Convert hex color to rgba with opacity
                    const hexToRgba = (hex, alpha) => {
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    };

                    // Draw filled rounded rectangle (rounded top corners, sharp bottom corners)
                    ctx.fillStyle = hexToRgba(bannerColor, bannerOpacity);
                    ctx.beginPath();
                    ctx.moveTo(bannerX + bannerTopRadius, bannerTopY);
                    ctx.lineTo(bannerX + bannerWidth - bannerTopRadius, bannerTopY);
                    ctx.arcTo(bannerX + bannerWidth, bannerTopY, bannerX + bannerWidth, bannerTopY + bannerTopRadius, bannerTopRadius);
                    ctx.lineTo(bannerX + bannerWidth, bannerTopY + bannerHeight);
                    ctx.lineTo(bannerX, bannerTopY + bannerHeight);
                    ctx.lineTo(bannerX, bannerTopY + bannerTopRadius);
                    ctx.arcTo(bannerX, bannerTopY, bannerX + bannerTopRadius, bannerTopY, bannerTopRadius);
                    ctx.closePath();
                    ctx.fill();

                    // Draw 2px white outside border
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(bannerX + bannerTopRadius, bannerTopY);
                    ctx.lineTo(bannerX + bannerWidth - bannerTopRadius, bannerTopY);
                    ctx.arcTo(bannerX + bannerWidth, bannerTopY, bannerX + bannerWidth, bannerTopY + bannerTopRadius, bannerTopRadius);
                    ctx.lineTo(bannerX + bannerWidth, bannerTopY + bannerHeight);
                    ctx.lineTo(bannerX, bannerTopY + bannerHeight);
                    ctx.lineTo(bannerX, bannerTopY + bannerTopRadius);
                    ctx.arcTo(bannerX, bannerTopY, bannerX + bannerTopRadius, bannerTopY, bannerTopRadius);
                    ctx.closePath();
                    ctx.stroke();

                    // Apply text case transformation
                    const transformBannerText = (text) => {
                        switch (bannerTextCase) {
                            case 'uppercase': return text.toUpperCase();
                            case 'lowercase': return text.toLowerCase();
                            case 'titlecase': return text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
                            case 'sentencecase': return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
                            default: return text;
                        }
                    };

                    const displayText = transformBannerText(bannerText);

                    // Draw banner text with letter spacing
                    ctx.fillStyle = '#ffffff';
                    ctx.font = `${bannerFontStyle} ${bannerFontWeight} ${bannerFontSize}px ${bannerFontFamily}`;
                    ctx.textBaseline = 'middle';

                    // Calculate text width with letter spacing
                    const chars = displayText.split('');
                    const charWidths = chars.map(char => ctx.measureText(char).width);
                    const letterSpacingPx = bannerFontSize * bannerLetterSpacing;
                    const totalTextWidth = charWidths.reduce((sum, w) => sum + w, 0) + (letterSpacingPx * (chars.length - 1));

                    // Calculate starting X based on alignment
                    let textX;
                    if (bannerTextAlign === 'center') {
                        textX = bannerX + (bannerWidth / 2) - (totalTextWidth / 2);
                    } else if (bannerTextAlign === 'right') {
                        textX = bannerX + bannerWidth - 20 - totalTextWidth;
                    } else {
                        textX = bannerX + 20;
                    }

                    const textY = bannerTopY + (bannerHeight / 2);

                    // Draw each character with custom letter spacing
                    let currentX = textX;
                    chars.forEach((char, i) => {
                        ctx.fillText(char, currentX, textY);
                        currentX += charWidths[i] + letterSpacingPx;
                    });

                    ctx.restore();
                }
            };

            useEffect(() => {
                renderCanvas();
            }, [baseImage, permanentOverlays, selectedOverlay, textElements, imageScale, imagePosition, imageRotation, aspectRatio, additionalOverlays, showSafeMargins, useBlurBackground, blurIntensity, blurImage, useBaseImageForBlur, blurImageScale, blurImagePosition, blurImageRotation, textBoxMargin, globalFontSize, globalColor, globalFontFamily, globalFontWeight, globalFontStyle, globalTextAlign, globalJustify, globalTextCase, bannerText, bannerLetterSpacing, bannerColor, bannerFontSize, bannerFontFamily, bannerFontWeight, bannerFontStyle, bannerTextAlign, bannerTextCase, bannerOpacity]);

            // Reposition text elements when aspect ratio changes
            useEffect(() => {
                setTextElements(prev => prev.map(el => {
                    const bottomMargin = aspectRatio === '9:16' ? 100 : 25;
                    const yPosition = dimensions.height - bottomMargin;
                    const xPosition = dimensions.width / 2;

                    return {
                        ...el,
                        x: xPosition,
                        y: yPosition,
                        maxWidth: dimensions.width - 100
                    };
                }));
            }, [aspectRatio, selectedOverlay]);

            const exportImage = () => {
                const canvas = canvasRef.current;
                if (!canvas) {
                    alert('Canvas not ready. Please try again.');
                    return;
                }

                try {
                    // Re-render canvas without safe margins for export
                    renderCanvas(false);

                    // Convert canvas to data URL
                    const dataUrl = canvas.toDataURL('image/png');

                    // Create download link
                    const link = document.createElement('a');
                    link.download = `instagram-${aspectRatio}-${Date.now()}.png`;
                    link.href = dataUrl;

                    // Trigger download
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Re-render with safe margins for display
                    renderCanvas(true);
                } catch (error) {
                    console.error('Export error:', error);
                    alert('Failed to export image. Error: ' + error.message);
                    // Re-render with safe margins even on error
                    renderCanvas(true);
                }
            };

            const copyImage = async () => {
                const canvas = canvasRef.current;
                if (!canvas) {
                    alert('Canvas not ready. Please try again.');
                    return;
                }

                try {
                    // Re-render canvas without safe margins for copy/share
                    renderCanvas(false);

                    // Get blob from canvas
                    const blob = await new Promise((resolve, reject) => {
                        canvas.toBlob((blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Failed to create blob from canvas'));
                            }
                        }, 'image/png', 1.0);
                    });

                    // Check if we're on mobile and Share API is available
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                    if (isMobile && navigator.share && navigator.canShare) {
                        // Use Share API on mobile
                        const file = new File([blob], `instagram-${aspectRatio}-${Date.now()}.png`, { type: 'image/png' });

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                files: [file],
                                title: 'Instagram Post',
                                text: 'Created with Instagram Template Editor'
                            });
                        } else {
                            throw new Error('Sharing files not supported');
                        }
                    } else if (navigator.clipboard && window.ClipboardItem) {
                        // Use Clipboard API on desktop
                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                        alert('Image copied to clipboard!');
                    } else {
                        // Fallback: download the image
                        const dataUrl = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.download = `instagram-${aspectRatio}-${Date.now()}.png`;
                        link.href = dataUrl;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        alert('Image downloaded.');
                    }

                    // Re-render with safe margins for display
                    renderCanvas(true);
                } catch (error) {
                    console.error('Copy/Share error:', error);

                    // If share fails, fallback to download
                    if (error.name === 'AbortError') {
                        // User cancelled share - do nothing
                    } else {
                        alert('Failed to share/copy image. Error: ' + error.message);
                    }

                    // Re-render with safe margins even on error
                    renderCanvas(true);
                }
            };

            return (
                <div className="min-h-screen bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 p-4">Instagram Template Editor</h1>

                        <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:px-4">
                            {/* Canvas - Always visible */}
                            <div className="lg:col-span-2 canvas-wrapper">
                                <div className="bg-white rounded-lg shadow-lg p-2 md:p-4 mx-2 md:mx-0">
                                    <div className="mb-3 flex flex-wrap gap-1 md:gap-2">
                                        {Object.entries(ASPECT_RATIOS).map(([key, value]) => (
                                            <button
                                                key={key}
                                                onClick={() => setAspectRatio(key)}
                                                className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium transition ${
                                                    aspectRatio === key
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {value.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Safe margins toggle for all aspect ratios */}
                                    <div className="mt-2 mb-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showSafeMargins}
                                                onChange={(e) => setShowSafeMargins(e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="text-xs md:text-sm text-gray-700 font-medium">
                                                Show 3:4 Safe Area (Instagram Grid Crop)
                                            </span>
                                        </label>
                                    </div>

                                    <div
                                        ref={containerRef}
                                        className="canvas-container relative mx-auto bg-gray-100 rounded-lg overflow-hidden"
                                        style={{ 
                                            width: maxCanvasWidth, 
                                            height: canvasHeight,
                                            cursor: isDragging ? 'grabbing' : 'grab'
                                        }}
                                        onMouseDown={handleImageDragStart}
                                        onTouchStart={handleImageDragStart}
                                    >
                                        <canvas
                                            ref={canvasRef}
                                            width={dimensions.width}
                                            height={dimensions.height}
                                            style={{
                                                width: '100%',
                                                height: '100%'
                                            }}
                                        />
                                    </div>

                                    {baseImage && (
                                        <div className="mt-3 md:mt-4 space-y-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">
                                                        Zoom
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0.1"
                                                        max="3"
                                                        step="0.01"
                                                        value={imageScale.toFixed(2)}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val)) setImageScale(val);
                                                        }}
                                                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                                    />
                                                    <button
                                                        onClick={() => setImageScale(1)}
                                                        className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="3"
                                                    step="0.01"
                                                    value={imageScale}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) setImageScale(val);
                                                    }}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">
                                                        X Position
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="-500"
                                                        max="500"
                                                        value={imagePosition.x.toFixed(0)}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val)) setImagePosition(prev => ({ ...prev, x: val }));
                                                        }}
                                                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                                    />
                                                    <button
                                                        onClick={() => setImagePosition(prev => ({ ...prev, x: 0 }))}
                                                        className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="-500"
                                                    max="500"
                                                    step="1"
                                                    value={imagePosition.x}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) setImagePosition(prev => ({ ...prev, x: val }));
                                                    }}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">
                                                        Y Position
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="-500"
                                                        max="500"
                                                        value={imagePosition.y.toFixed(0)}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val)) setImagePosition(prev => ({ ...prev, y: val }));
                                                        }}
                                                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                                                    />
                                                    <button
                                                        onClick={() => setImagePosition(prev => ({ ...prev, y: 0 }))}
                                                        className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="-500"
                                                    max="500"
                                                    step="1"
                                                    value={imagePosition.y}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) setImagePosition(prev => ({ ...prev, y: val }));
                                                    }}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                                                    Rotation
                                                </label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    <button
                                                        onClick={() => setImageRotation((imageRotation + 90) % 360)}
                                                        className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                                                        title="Rotate 90° clockwise"
                                                    >
                                                        90°
                                                    </button>
                                                    <button
                                                        onClick={() => setImageRotation((imageRotation + 180) % 360)}
                                                        className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                                                        title="Rotate 180°"
                                                    >
                                                        180°
                                                    </button>
                                                    <button
                                                        onClick={() => setImageRotation((imageRotation + 270) % 360)}
                                                        className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium transition"
                                                        title="Rotate 270° clockwise (90° counter-clockwise)"
                                                    >
                                                        270°
                                                    </button>
                                                    <button
                                                        onClick={() => setImageRotation(0)}
                                                        className="px-2 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium transition"
                                                        title="Reset rotation"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 mt-3 md:mt-4">
                                        <button
                                            onClick={copyImage}
                                            className="bg-blue-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-blue-700 transition"
                                        >
                                            <span className="hidden md:inline">Copy</span>
                                            <span className="md:hidden">Share</span>
                                        </button>
                                        <button
                                            onClick={exportImage}
                                            className="bg-green-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-base font-semibold hover:bg-green-700 transition"
                                        >
                                            Export as PNG
                                        </button>
                                    </div>

                                    {/* Mobile Controls Toggle */}
                                    <button
                                        onClick={() => setShowMobileControls(!showMobileControls)}
                                        className="lg:hidden w-full mt-3 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                                    >
                                        {showMobileControls ? 'Hide' : 'Show'} Controls
                                    </button>
                                </div>
                            </div>

                            {/* Controls - Desktop sidebar / Mobile bottom panel */}
                            <div className={`${showMobileControls ? 'block' : 'hidden'} lg:block controls-section`}>
                                {/* Mobile Tabs */}
                                <div className="lg:hidden flex border-b border-gray-200 bg-white sticky top-0 z-10">
                                    <button
                                        onClick={() => setActiveTab('image')}
                                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'image' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                                    >
                                        Image
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('overlays')}
                                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'overlays' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                                    >
                                        Overlays
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('text')}
                                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'text' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
                                    >
                                        Text
                                    </button>
                                </div>

                                <div className="space-y-4 p-2 md:p-0 mobile-panel">
                                    {/* Base Image - Desktop: always show, Mobile: show in 'image' tab */}
                                    <div className={`${activeTab === 'image' || window.innerWidth >= 1024 ? 'block' : 'hidden'} lg:block bg-white rounded-lg shadow-lg p-2`}>
                                        <h2 className="text-base md:text-lg font-semibold mb-2">Base Image</h2>
                                        <label className="block mb-3">
                                            <span className="sr-only">Choose base image</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleBaseImageUpload}
                                                className="block w-full text-xs md:text-sm text-gray-500 file:mr-2 md:file:mr-4 file:py-1.5 md:file:py-2 file:px-3 md:file:px-4 file:rounded-full file:border-0 file:text-xs md:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </label>

                                        {/* Blur Background Options */}
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <label className="flex items-center gap-2 cursor-pointer mb-3">
                                                <input
                                                    type="checkbox"
                                                    checked={useBlurBackground}
                                                    onChange={(e) => setUseBlurBackground(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <span className="text-xs md:text-sm text-gray-700 font-medium">
                                                    Enable Blur Background
                                                </span>
                                            </label>

                                            {useBlurBackground && (
                                                <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={useBaseImageForBlur}
                                                            onChange={(e) => setUseBaseImageForBlur(e.target.checked)}
                                                            className="w-4 h-4 text-blue-600 rounded"
                                                        />
                                                        <span className="text-xs text-gray-700">
                                                            Use base image for blur
                                                        </span>
                                                    </label>

                                                    {!useBaseImageForBlur && (
                                                        <label className="block">
                                                            <span className="text-xs text-gray-600 mb-1 block">Blur Image</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleBlurImageUpload}
                                                                className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                                            />
                                                        </label>
                                                    )}

                                                    <div>
                                                        <label className="text-xs text-gray-600 mb-1 block">Blur Intensity</label>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="250"
                                                                step="1"
                                                                value={blurIntensity}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    if (!isNaN(val)) setBlurIntensity(val);
                                                                }}
                                                                className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                                                            />
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="250"
                                                            step="1"
                                                            value={blurIntensity}
                                                            onChange={(e) => setBlurIntensity(parseInt(e.target.value))}
                                                            className="w-full"
                                                        />
                                                    </div>

                                                    {/* Blur Image Controls */}
                                                    <div className="space-y-2 pt-2 border-t border-gray-100">
                                                        <p className="text-xs font-medium text-gray-600">Blur Image Controls</p>

                                                        <div>
                                                            <label className="text-xs text-gray-600 mb-1 block">Zoom</label>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <input
                                                                    type="number"
                                                                    min="0.1"
                                                                    max="3"
                                                                    step="0.01"
                                                                    value={blurImageScale.toFixed(2)}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value);
                                                                        if (!isNaN(val)) setBlurImageScale(val);
                                                                    }}
                                                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                                                                />
                                                                <button
                                                                    onClick={() => setBlurImageScale(1)}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    Reset
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0.1"
                                                                max="3"
                                                                step="0.01"
                                                                value={blurImageScale}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val)) setBlurImageScale(val);
                                                                }}
                                                                className="w-full"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-xs text-gray-600 mb-1 block">X Position</label>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <input
                                                                    type="number"
                                                                    min="-500"
                                                                    max="500"
                                                                    value={blurImagePosition.x.toFixed(0)}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value);
                                                                        if (!isNaN(val)) setBlurImagePosition(prev => ({ ...prev, x: val }));
                                                                    }}
                                                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                                                                />
                                                                <button
                                                                    onClick={() => setBlurImagePosition(prev => ({ ...prev, x: 0 }))}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    Reset
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="-500"
                                                                max="500"
                                                                step="1"
                                                                value={blurImagePosition.x}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val)) setBlurImagePosition(prev => ({ ...prev, x: val }));
                                                                }}
                                                                className="w-full"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-xs text-gray-600 mb-1 block">Y Position</label>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <input
                                                                    type="number"
                                                                    min="-500"
                                                                    max="500"
                                                                    value={blurImagePosition.y.toFixed(0)}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value);
                                                                        if (!isNaN(val)) setBlurImagePosition(prev => ({ ...prev, y: val }));
                                                                    }}
                                                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                                                                />
                                                                <button
                                                                    onClick={() => setBlurImagePosition(prev => ({ ...prev, y: 0 }))}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    Reset
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="-500"
                                                                max="500"
                                                                step="1"
                                                                value={blurImagePosition.y}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val)) setBlurImagePosition(prev => ({ ...prev, y: val }));
                                                                }}
                                                                className="w-full"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-xs text-gray-600 mb-1 block">Rotation</label>
                                                            <div className="grid grid-cols-4 gap-1">
                                                                <button
                                                                    onClick={() => setBlurImageRotation((blurImageRotation + 90) % 360)}
                                                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition"
                                                                >
                                                                    90°
                                                                </button>
                                                                <button
                                                                    onClick={() => setBlurImageRotation((blurImageRotation + 180) % 360)}
                                                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition"
                                                                >
                                                                    180°
                                                                </button>
                                                                <button
                                                                    onClick={() => setBlurImageRotation((blurImageRotation + 270) % 360)}
                                                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition"
                                                                >
                                                                    270°
                                                                </button>
                                                                <button
                                                                    onClick={() => setBlurImageRotation(0)}
                                                                    className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs transition"
                                                                >
                                                                    Reset
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Additional Overlays - Desktop: always show, Mobile: show in 'overlays' tab */}
                                    <div className={`${activeTab === 'overlays' || window.innerWidth >= 1024 ? 'block' : 'hidden'} lg:block bg-white rounded-lg shadow-lg p-2`}>
                                        <h2 className="text-base md:text-lg font-semibold mb-2">Overlay Type</h2>
                                        <div className="space-y-3">
                                            <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                                <input
                                                    type="radio"
                                                    name="overlayType"
                                                    value="regular"
                                                    checked={selectedOverlay === 'regular'}
                                                    onChange={(e) => setSelectedOverlay(e.target.value)}
                                                    className="w-5 h-5 text-blue-600"
                                                />
                                                <span className="text-sm md:text-base font-medium text-gray-700">Regular</span>
                                            </label>
                                            <label className="flex items-center space-x-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                                <input
                                                    type="radio"
                                                    name="overlayType"
                                                    value="custom"
                                                    checked={selectedOverlay === 'custom'}
                                                    onChange={(e) => setSelectedOverlay(e.target.value)}
                                                    className="w-5 h-5 text-blue-600"
                                                />
                                                <span className="text-sm md:text-base font-medium text-gray-700">Custom</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Tag Banner Controls - Only show when Custom overlay is selected */}
                                    {selectedOverlay === 'custom' && (
                                        <div className={`${activeTab === 'overlays' || window.innerWidth >= 1024 ? 'block' : 'hidden'} lg:block bg-white rounded-lg shadow-lg p-2`}>
                                            <h2 className="text-base md:text-lg font-semibold mb-2">Tag Banner</h2>

                                            <div className="space-y-3">
                                                {/* Banner Text */}
                                                <div>
                                                    <label className="text-xs text-gray-600 mb-1 block">Banner Text</label>
                                                    <input
                                                        type="text"
                                                        value={bannerText}
                                                        onChange={(e) => setBannerText(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded text-xs md:text-sm"
                                                    />
                                                </div>

                                                {/* Letter Spacing and Color */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-600 mb-1 block">Letter Spacing (%)</label>
                                                        <input
                                                            type="number"
                                                            value={bannerLetterSpacing * 100}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (!isNaN(val)) setBannerLetterSpacing(val / 100);
                                                            }}
                                                            className="w-full p-2 border border-gray-300 rounded text-xs md:text-sm"
                                                            step="1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-600 mb-1 block">Color</label>
                                                        <input
                                                            type="color"
                                                            value={bannerColor}
                                                            onChange={(e) => setBannerColor(e.target.value)}
                                                            className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Transparency */}
                                                <div>
                                                    <label className="text-xs text-gray-600 mb-1 block">Transparency ({Math.round(bannerOpacity * 100)}%)</label>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={bannerOpacity * 100}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val)) setBannerOpacity(val / 100);
                                                        }}
                                                        className="w-full"
                                                    />
                                                </div>

                                                {/* Font Size and Font Family */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-600 mb-1 block">Font Size</label>
                                                        <input
                                                            type="number"
                                                            value={bannerFontSize}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (!isNaN(val)) setBannerFontSize(val);
                                                            }}
                                                            className="w-full p-2 border border-gray-300 rounded text-xs md:text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-600 mb-1 block">Font</label>
                                                        <select
                                                            value={bannerFontFamily}
                                                            onChange={(e) => setBannerFontFamily(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="Helvetica Neue">Helvetica Neue</option>
                                                            <option value="Arial">Arial</option>
                                                            <option value="Arial Black">Arial Black</option>
                                                            <option value="Impact">Impact</option>
                                                            <option value="Georgia">Georgia</option>
                                                            <option value="Times New Roman">Times New Roman</option>
                                                            <option value="Courier New">Courier New</option>
                                                            <option value="Verdana">Verdana</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Font Weight and Font Style */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-600 mb-1 block">Weight</label>
                                                        <select
                                                            value={bannerFontWeight}
                                                            onChange={(e) => setBannerFontWeight(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="normal">Normal</option>
                                                            <option value="bold">Bold</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-600 mb-1 block">Style</label>
                                                        <select
                                                            value={bannerFontStyle}
                                                            onChange={(e) => setBannerFontStyle(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="normal">Normal</option>
                                                            <option value="italic">Italic</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Text Align and Text Case */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-600 mb-1 block">Align</label>
                                                        <select
                                                            value={bannerTextAlign}
                                                            onChange={(e) => setBannerTextAlign(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="left">Left</option>
                                                            <option value="center">Center</option>
                                                            <option value="right">Right</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-600 mb-1 block">Text Case</label>
                                                        <select
                                                            value={bannerTextCase}
                                                            onChange={(e) => setBannerTextCase(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="default">Default</option>
                                                            <option value="uppercase">UPPERCASE</option>
                                                            <option value="lowercase">lowercase</option>
                                                            <option value="titlecase">Title Case</option>
                                                            <option value="sentencecase">Sentence case</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Text Controls - Desktop: always show, Mobile: show in 'text' tab */}
                                    <div className={`${activeTab === 'text' || window.innerWidth >= 1024 ? 'block' : 'hidden'} lg:block bg-white rounded-lg shadow-lg p-2`}>
                                        <h2 className="text-base md:text-lg font-semibold mb-2">Text</h2>

                                        {/* Global Text Formatting */}
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <h3 className="text-sm font-semibold mb-2 text-gray-700">Global Formatting</h3>

                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <label className="text-xs text-gray-600">Size</label>
                                                    <input
                                                        type="number"
                                                        value={globalFontSize}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val)) setGlobalFontSize(val);
                                                        }}
                                                        className="w-full p-1 border border-gray-300 rounded text-xs md:text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-600">Color</label>
                                                    <input
                                                        type="color"
                                                        value={globalColor}
                                                        onChange={(e) => setGlobalColor(e.target.value)}
                                                        className="w-full p-1 border border-gray-300 rounded h-8"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <label className="text-xs text-gray-600">Font Family</label>
                                                <select
                                                    value={globalFontFamily}
                                                    onChange={(e) => setGlobalFontFamily(e.target.value)}
                                                    className="w-full p-1 border border-gray-300 rounded text-xs md:text-sm"
                                                >
                                                    <option value="Helvetica Neue">Helvetica Neue</option>
                                                    <option value="Arial">Arial</option>
                                                    <option value="Helvetica">Helvetica</option>
                                                    <option value="Georgia">Georgia</option>
                                                    <option value="Times New Roman">Times New Roman</option>
                                                    <option value="Courier New">Courier New</option>
                                                    <option value="Verdana">Verdana</option>
                                                    <option value="Impact">Impact</option>
                                                </select>
                                            </div>

                                            <div className="mb-2">
                                                <label className="text-xs text-gray-600 mb-1 block">Font Style</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setGlobalFontWeight('normal');
                                                            setGlobalFontStyle('normal');
                                                        }}
                                                        className={`px-2 py-2 rounded text-xs font-medium transition ${
                                                            globalFontWeight === 'normal' && globalFontStyle === 'normal' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        Normal
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalFontWeight('bold');
                                                            setGlobalFontStyle('normal');
                                                        }}
                                                        className={`px-2 py-2 rounded text-xs font-bold transition ${
                                                            globalFontWeight === 'bold' && globalFontStyle === 'normal' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        Bold
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalFontWeight('normal');
                                                            setGlobalFontStyle('italic');
                                                        }}
                                                        className={`px-2 py-2 rounded text-xs italic transition ${
                                                            globalFontWeight === 'normal' && globalFontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        Italic
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalFontWeight('bold');
                                                            setGlobalFontStyle('italic');
                                                        }}
                                                        className={`px-2 py-2 rounded text-xs font-bold italic transition ${
                                                            globalFontWeight === 'bold' && globalFontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        Bold Italic
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <label className="text-xs text-gray-600 mb-1 block">Alignment</label>
                                                <div className="grid grid-cols-4 gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setGlobalTextAlign('left');
                                                            setGlobalJustify(false);
                                                        }}
                                                        className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                            globalTextAlign === 'left' && !globalJustify ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                        title="Align Left"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M2 3h12v1H2V3zm0 3h8v1H2V6zm0 3h12v1H2V9zm0 3h8v1H2v-1z"/>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalTextAlign('center');
                                                            setGlobalJustify(false);
                                                        }}
                                                        className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                            globalTextAlign === 'center' && !globalJustify ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                        title="Align Center"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M2 3h12v1H2V3zm2 3h8v1H4V6zm-2 3h12v1H2V9zm2 3h8v1H4v-1z"/>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalTextAlign('right');
                                                            setGlobalJustify(false);
                                                        }}
                                                        className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                            globalTextAlign === 'right' && !globalJustify ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                        title="Align Right"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M2 3h12v1H2V3zm4 3h8v1H6V6zm-4 3h12v1H2V9zm4 3h8v1H6v-1z"/>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setGlobalTextAlign('justify');
                                                            setGlobalJustify(true);
                                                        }}
                                                        className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                            globalJustify ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                        title="Justify"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M2 3h12v1H2V3zm0 3h12v1H2V6zm0 3h12v1H2V9zm0 3h12v1H2v-1z"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <label className="text-xs text-gray-600">Text Case</label>
                                                <select
                                                    value={globalTextCase}
                                                    onChange={(e) => setGlobalTextCase(e.target.value)}
                                                    className="w-full p-1 border border-gray-300 rounded text-xs md:text-sm"
                                                >
                                                    <option value="default">Default</option>
                                                    <option value="uppercase">UPPERCASE</option>
                                                    <option value="lowercase">lowercase</option>
                                                    <option value="capitalize">Capitalize Each Word</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="text-xs text-gray-600 mb-1 block">Textbox Margin</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="500"
                                                step="10"
                                                value={textBoxMargin}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val)) setTextBoxMargin(val);
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded text-xs md:text-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={addText}
                                            className="w-full bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium hover:bg-blue-700 transition mb-3"
                                        >
                                            Add Text
                                        </button>

                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {[...textElements].reverse().map((el, reverseIndex) => {
                                                const index = textElements.length - 1 - reverseIndex;
                                                return (
                                                <div key={el.id} className="border border-gray-200 rounded-lg p-2 md:p-3">
                                                    {/* Header with number and reorder buttons */}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-semibold text-gray-700">Textbox #{textElements.length - index}</span>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => moveTextElementDown(index)}
                                                                disabled={index === textElements.length - 1}
                                                                className={`px-2 py-1 rounded text-xs transition ${
                                                                    index === textElements.length - 1
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                }`}
                                                                title="Move Up (towards top of canvas)"
                                                            >
                                                                ↑
                                                            </button>
                                                            <button
                                                                onClick={() => moveTextElementUp(index)}
                                                                disabled={index === 0}
                                                                className={`px-2 py-1 rounded text-xs transition ${
                                                                    index === 0
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                }`}
                                                                title="Move Down (towards bottom of canvas)"
                                                            >
                                                                ↓
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <textarea
                                                        value={el.text}
                                                        onChange={(e) => updateTextElement(el.id, { text: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 rounded mb-2 text-xs md:text-sm"
                                                        rows="2"
                                                    />

                                                    {/* Custom settings checkbox */}
                                                    <label className="flex items-center space-x-2 mb-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={el.useCustomSettings || false}
                                                            onChange={(e) => updateTextElement(el.id, { useCustomSettings: e.target.checked })}
                                                            className="w-4 h-4 text-blue-600"
                                                        />
                                                        <span className="text-xs text-gray-700 font-medium">Use Custom Formatting</span>
                                                    </label>

                                                    {el.useCustomSettings && (
                                                        <>
                                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                                        <div>
                                                            <label className="text-xs text-gray-600">Size</label>
                                                            <input
                                                                type="number"
                                                                value={el.fontSize}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    if (!isNaN(val)) updateTextElement(el.id, { fontSize: val });
                                                                }}
                                                                className="w-full p-1 border border-gray-300 rounded text-xs md:text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-600">Color</label>
                                                            <input
                                                                type="color"
                                                                value={el.color}
                                                                onChange={(e) => updateTextElement(el.id, { color: e.target.value })}
                                                                className="w-full h-8 border border-gray-300 rounded"
                                                            />
                                                        </div>
                                                    </div>
                                                    <select
                                                        value={el.fontFamily}
                                                        onChange={(e) => updateTextElement(el.id, { fontFamily: e.target.value })}
                                                        className="w-full p-1 border border-gray-300 rounded text-xs md:text-sm mb-2"
                                                    >
                                                        <option value="Helvetica Neue">Helvetica Neue</option>
                                                        <option value="Arial">Arial</option>
                                                        <option value="Helvetica">Helvetica</option>
                                                        <option value="Georgia">Georgia</option>
                                                        <option value="Times New Roman">Times New Roman</option>
                                                        <option value="Courier New">Courier New</option>
                                                        <option value="Verdana">Verdana</option>
                                                        <option value="Impact">Impact</option>
                                                    </select>
                                                    <div className="mb-2">
                                                        <label className="text-xs text-gray-600 mb-1 block">Font Style</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    fontWeight: 'normal',
                                                                    fontStyle: 'normal'
                                                                })}
                                                                className={`px-2 py-2 rounded text-xs font-medium transition ${
                                                                    (el.fontWeight === 'normal' || !el.fontWeight) && (el.fontStyle === 'normal' || !el.fontStyle) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                            >
                                                                Normal
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    fontWeight: 'bold',
                                                                    fontStyle: 'normal'
                                                                })}
                                                                className={`px-2 py-2 rounded text-xs font-bold transition ${
                                                                    el.fontWeight === 'bold' && (el.fontStyle === 'normal' || !el.fontStyle) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                            >
                                                                Bold
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    fontWeight: 'normal',
                                                                    fontStyle: 'italic'
                                                                })}
                                                                className={`px-2 py-2 rounded text-xs italic transition ${
                                                                    (el.fontWeight === 'normal' || !el.fontWeight) && el.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                            >
                                                                Italic
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    fontWeight: 'bold',
                                                                    fontStyle: 'italic'
                                                                })}
                                                                className={`px-2 py-2 rounded text-xs font-bold italic transition ${
                                                                    el.fontWeight === 'bold' && el.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                            >
                                                                Bold Italic
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mb-2">
                                                        <label className="text-xs text-gray-600 mb-1 block">Alignment</label>
                                                        <div className="grid grid-cols-4 gap-1">
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    textAlign: 'left',
                                                                    justify: false
                                                                })}
                                                                className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                                    el.textAlign === 'left' && !el.justify ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                                title="Align Left"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                                    <path d="M2 3h12v1H2V3zm0 3h8v1H2V6zm0 3h12v1H2V9zm0 3h8v1H2v-1z"/>
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    textAlign: 'center',
                                                                    justify: false
                                                                })}
                                                                className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                                    el.textAlign === 'center' && !el.justify ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                                title="Align Center"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                                    <path d="M2 3h12v1H2V3zm2 3h8v1H4V6zm-2 3h12v1H2V9zm2 3h8v1H4v-1z"/>
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    textAlign: 'right',
                                                                    justify: false
                                                                })}
                                                                className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                                    el.textAlign === 'right' && !el.justify ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                                title="Align Right"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                                    <path d="M2 3h12v1H2V3zm4 3h8v1H6V6zm-4 3h12v1H2V9zm4 3h8v1H6v-1z"/>
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => updateTextElement(el.id, {
                                                                    textAlign: 'justify',
                                                                    justify: true
                                                                })}
                                                                className={`px-2 py-2 rounded text-sm font-medium transition flex items-center justify-center ${
                                                                    el.justify ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                                title="Justify"
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                                    <path d="M2 3h12v1H2V3zm0 3h12v1H2V6zm0 3h12v1H2V9zm0 3h12v1H2v-1z"/>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mb-2">
                                                        <label className="text-xs text-gray-600 mb-1 block">Text Case</label>
                                                        <select
                                                            value={el.textCase || 'default'}
                                                            onChange={(e) => updateTextElement(el.id, { textCase: e.target.value })}
                                                            className="w-full p-1 border border-gray-300 rounded text-xs md:text-sm"
                                                        >
                                                            <option value="default">Default</option>
                                                            <option value="uppercase">UPPERCASE</option>
                                                            <option value="lowercase">lowercase</option>
                                                            <option value="titlecase">Title Case</option>
                                                            <option value="sentencecase">Sentence case</option>
                                                        </select>
                                                    </div>
                                                        </>
                                                    )}

                                                    <button
                                                        onClick={() => deleteTextElement(el.id)}
                                                        className="w-full bg-red-500 text-white px-2 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm hover:bg-red-600 transition mt-2"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
