import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import {
  DirectionModeProvider,
  useDirectionMode,
  directionAttr,
} from './state/DirectionModeContext';
import { MediaFrameProvider } from './state/MediaFrameContext';
import { CardFitProvider } from './state/CardFitContext';
import { LaneProvider } from './state/LaneContext';
import { CtaProvider } from './state/CtaContext';
import { MediaTruthProvider } from './state/MediaTruthContext';
import { TagStyleProvider } from './state/TagStyleContext';
import { MarginProvider } from './state/MarginContext';
import { CardFrameProvider } from './state/CardFrameContext';
import { DividerProvider } from './state/DividerContext';
import { TitleRegisterProvider } from './state/TitleRegisterContext';
import { ImageTreatmentProvider } from './state/ImageTreatmentContext';
import { CaptionRegisterProvider } from './state/CaptionRegisterContext';
import { ShippedProofProvider } from './state/ShippedProofContext';
import { ProofPlacementProvider } from './state/ProofPlacementContext';
import { AspectVarianceProvider } from './state/AspectVarianceContext';
import { DensityProvider } from './state/DensityContext';
import { CardScaleProvider } from './state/CardScaleContext';
import { ShellPickerProvider } from './state/ShellPickerContext';
import { PresetProvider } from './state/PresetContext';
import { LabChromeProvider } from './state/LabChromeContext';
import { StandardProofModeProvider } from './state/StandardProofModeContext';
import { Narrow4StandardTagStyleProvider } from './state/Narrow4StandardTagStyleContext';
import { Narrow4FeaturedAspectVarianceProvider } from './state/Narrow4FeaturedAspectVarianceContext';
import { Narrow4StandardAspectVarianceProvider } from './state/Narrow4StandardAspectVarianceContext';
import { Narrow4EyebrowPlacementProvider } from './state/Narrow4EyebrowPlacementContext';
import { Narrow4FeaturedProofModeProvider } from './state/Narrow4FeaturedProofModeContext';
import { PullQuoteRegisterTestProvider } from './state/PullQuoteRegisterTestContext';
import { InlineEmphasisTestProvider } from './state/InlineEmphasisTestContext';
import { GateAIonEyebrowStyleProvider } from './state/GateAIonEyebrowStyleContext';
import { GateAIonTldrStyleProvider } from './state/GateAIonTldrStyleContext';
import { GateAIonDividerStyleProvider } from './state/GateAIonDividerStyleContext';
import { GateAIonHeroHeightProvider } from './state/GateAIonHeroHeightContext';
import { GateAIonS02ArtifactTreatmentProvider } from './state/GateAIonS02ArtifactTreatmentContext';
import { F3BPathProvider } from './state/F3BPathContext';
import { F3TiltRangeProvider } from './state/F3TiltRangeContext';
import { F3EntranceStaggerProvider } from './state/F3EntranceStaggerContext';
import { F3BConceptProvider } from './state/F3BConceptContext';
import { F3AConceptProvider } from './state/F3AConceptContext';
import { F3HoverTreatmentProvider } from './state/F3HoverTreatmentContext';
import { F3VisibilityProvider } from './state/F3VisibilityContext';
import { F3TitleCopyProvider } from './state/F3TitleCopyContext';
import { F3BStickyOffsetProvider } from './state/F3BStickyOffsetContext';
import { F3StackOrderingProvider } from './state/F3StackOrderingContext';
import { F3TextTreatmentProvider } from './state/F3TextTreatmentContext';
import { F3TitleRegisterProvider } from './state/F3TitleRegisterContext';
import { F3BColumnWidthProvider } from './state/F3BColumnWidthContext';
import { F3SubjectFormsProvider } from './state/F3SubjectFormsContext';
import { F3PegboardHangProvider } from './state/F3PegboardHangContext';
import { F3SvgStyleProvider } from './state/F3SvgStyleContext';
import { F3RoughModifiersProvider } from './state/F3RoughModifiersContext';
import { Hero8TextureFilterDefs } from './components/hero8/cells/SvgStyleTransform';
import { GateAIonHeroPositionProvider } from './state/GateAIonHeroPositionContext';
import { GateAIonBorderRadiusProvider } from './state/GateAIonBorderRadiusContext';
import { GateAIonHeroAspectProvider } from './state/GateAIonHeroAspectContext';
import { GateAIonSectionNumberStyleProvider } from './state/GateAIonSectionNumberStyleContext';
import { GateAIonProgressTrackProvider } from './state/GateAIonProgressTrackContext';
import { GateAIonWithinSectionDividerProvider } from './state/GateAIonWithinSectionDividerContext';
import { GateAIonInternalGapProvider } from './state/GateAIonInternalGapContext';
import { GateAIonTextColumnWidthProvider } from './state/GateAIonTextColumnWidthContext';
import { GateAIonContentAlignmentProvider } from './state/GateAIonContentAlignmentContext';
import { GateAIonImageWidthProvider } from './state/GateAIonImageWidthContext';
import { GateAIonDualContainerEnabledProvider } from './state/GateAIonDualContainerEnabledContext';
import { GateAIonDualContainerRatioProvider } from './state/GateAIonDualContainerRatioContext';
import { GateAIonHeroBleedProvider } from './state/GateAIonHeroBleedContext';
import { GateAIonBodyImageWidthProvider } from './state/GateAIonBodyImageWidthContext';
import { GateAIonFinalImageWidthProvider } from './state/GateAIonFinalImageWidthContext';
import { GateAIonHookModeProvider } from './state/GateAIonHookModeContext';
import { GateAIonSection01PositionProvider } from './state/GateAIonSection01PositionContext';
import { GateAIonPreTocHeroWidthProvider } from './state/GateAIonPreTocHeroWidthContext';
import { GateAIonEyebrowSpacingProvider } from './state/GateAIonEyebrowSpacingContext';
import { GateAIonSectionNumberSpacingProvider } from './state/GateAIonSectionNumberSpacingContext';
import { GateAIonEyebrowChunkGapProvider } from './state/GateAIonEyebrowChunkGapContext';
import { GateAIonHeroDensityModeProvider } from './state/GateAIonHeroDensityModeContext';
import { GateAIonS05GuardrailsLayoutProvider } from './state/GateAIonS05GuardrailsLayoutContext';
import { GateAIonTldrPositionProvider } from './state/GateAIonTldrPositionContext';
import { GateAIonS01ContributionGridProvider } from './state/GateAIonS01ContributionGridContext';
import { GateAIonS01TldrRegisterProvider } from './state/GateAIonS01TldrRegisterContext';
import { GateAIonS01MetaStripProvider } from './state/GateAIonS01MetaStripContext';
import { GateAIonMetaStripPositionProvider } from './state/GateAIonMetaStripPositionContext';
import { GateAIonS03DirectionProvider } from './state/GateAIonS03DirectionContext';
import { GateAIonS03PersonaArtifactProvider } from './state/GateAIonS03PersonaArtifactContext';
import { GateAIonS03PersonaContentDensityProvider } from './state/GateAIonS03PersonaContentDensityContext';
import { GateAIonS03SubSectionGapProvider } from './state/GateAIonS03SubSectionGapContext';
import { GateAIonS03NativePersonaLayoutProvider } from './state/GateAIonS03NativePersonaLayoutContext';
import { GateAIonS03ExtE1ThemesStyleProvider } from './state/GateAIonS03ExtE1ThemesStyleContext';
import { GateAIonS03ExtE1LeanDirectionProvider } from './state/GateAIonS03ExtE1LeanDirectionContext';
import { GateAIonS07RowIdProvider } from './state/GateAIonS07RowIdContext';
import { GateAIonOutcomesModeProvider } from './state/GateAIonOutcomesModeContext';
import { GateAIonArtifactPlaygroundProvider } from './state/GateAIonArtifactPlaygroundContext';

/**
 * DirectionScope — reads DirectionMode context and renders the
 * data-direction wrapper. Sits inside DirectionModeProvider so it can
 * consume the context. Default mode is 'light' (W1); 'dark' resolves
 * to data-direction="w1-d" (W1-D companion). See DirectionModeContext.
 */
function DirectionScope({ children }: { children: React.ReactNode }) {
  const { state } = useDirectionMode();
  return <div data-direction={directionAttr(state)}>{children}</div>;
}

export default function App() {
  return (
    <DirectionModeProvider>
    <DirectionScope>
      <MediaFrameProvider>
      <CardFitProvider>
      <LaneProvider>
        <CtaProvider>
          <MediaTruthProvider>
            <TagStyleProvider>
              <MarginProvider>
                <CardFrameProvider>
                  <DividerProvider>
                    <TitleRegisterProvider>
                      <ImageTreatmentProvider>
                        <CaptionRegisterProvider>
                          <ShippedProofProvider>
                            <ProofPlacementProvider>
                              <AspectVarianceProvider>
                                <DensityProvider>
                                  <CardScaleProvider>
                                    <ShellPickerProvider>
                                      <PresetProvider>
                                        <LabChromeProvider>
                                          <StandardProofModeProvider>
                                            <Narrow4StandardTagStyleProvider>
                                              <Narrow4FeaturedAspectVarianceProvider>
                                                <Narrow4StandardAspectVarianceProvider>
                                                  <Narrow4FeaturedProofModeProvider>
                                                  <PullQuoteRegisterTestProvider>
                                                  <InlineEmphasisTestProvider>
                                                  <Narrow4EyebrowPlacementProvider>
                                                    <GateAIonEyebrowStyleProvider>
                                                      <GateAIonTldrStyleProvider>
                                                        <GateAIonDividerStyleProvider>
                                                            <GateAIonHeroHeightProvider>
                                                              <GateAIonHeroPositionProvider>
                                                                <GateAIonBorderRadiusProvider>
                                                                  <GateAIonHeroAspectProvider>
                                                                    <GateAIonSectionNumberStyleProvider>
                                                                      <GateAIonWithinSectionDividerProvider>
                                                                        <GateAIonInternalGapProvider>
                                                                          <GateAIonTextColumnWidthProvider>
                                                                            <GateAIonContentAlignmentProvider>
                                                                              <GateAIonImageWidthProvider>
                                                                                <GateAIonDualContainerEnabledProvider>
                                                                                  <GateAIonDualContainerRatioProvider>
                                                                                    <GateAIonHeroBleedProvider>
                                                                                      <GateAIonBodyImageWidthProvider>
                                                                                        <GateAIonFinalImageWidthProvider>
                                                                                          <GateAIonHookModeProvider>
                                                                                            <GateAIonSection01PositionProvider>
                                                                                              <GateAIonPreTocHeroWidthProvider>
                                                                                                <GateAIonEyebrowSpacingProvider>
                                                                                                  <GateAIonSectionNumberSpacingProvider>
                                                                                                  <GateAIonEyebrowChunkGapProvider>
                                                                                                  <GateAIonHeroDensityModeProvider>
                                                                                                  <GateAIonS05GuardrailsLayoutProvider>
                                                                                                    <GateAIonTldrPositionProvider>
                                                                                                      <GateAIonS01ContributionGridProvider>
                                                                                                        <GateAIonS01TldrRegisterProvider>
                                                                                                        <GateAIonS01MetaStripProvider>
                                                                                                          <GateAIonMetaStripPositionProvider>
                                                                                                            <GateAIonProgressTrackProvider>
                                                                                                              <GateAIonS03DirectionProvider>
                                                                                                                <GateAIonS03PersonaArtifactProvider>
                                                                                                                <GateAIonS03PersonaContentDensityProvider>
                                                                                                                <GateAIonS03SubSectionGapProvider>
                                                                                                                <GateAIonS03NativePersonaLayoutProvider>
                                                                                                                <GateAIonS03ExtE1ThemesStyleProvider>
                                                                                                                <GateAIonS03ExtE1LeanDirectionProvider>
                                                                                                                <GateAIonS07RowIdProvider>
                                                                                                                <GateAIonOutcomesModeProvider>
                                                                                                                <GateAIonArtifactPlaygroundProvider>
                                                                                                                <GateAIonS02ArtifactTreatmentProvider>
                                                                                                                <F3BPathProvider>
                                                                                                                <F3TiltRangeProvider>
                                                                                                                <F3EntranceStaggerProvider>
                                                                                                                <F3BConceptProvider>
                                                                                                                <F3AConceptProvider>
                                                                                                                <F3HoverTreatmentProvider>
                                                                                                                <F3VisibilityProvider>
                                                                                                                <F3TitleCopyProvider>
                                                                                                                <F3BStickyOffsetProvider>
                                                                                                                <F3StackOrderingProvider>
                                                                                                                <F3TextTreatmentProvider>
                                                                                                                <F3TitleRegisterProvider>
                                                                                                                <F3BColumnWidthProvider>
                                                                                                                <F3SubjectFormsProvider>
                                                                                                                <F3PegboardHangProvider>
                                                                                                                <F3SvgStyleProvider>
                                                                                                                <F3RoughModifiersProvider>
                                                                                                                  <Hero8TextureFilterDefs />
                                                                                                                  <RouterProvider router={router} />
                                                                                                                </F3RoughModifiersProvider>
                                                                                                                </F3SvgStyleProvider>
                                                                                                                </F3PegboardHangProvider>
                                                                                                                </F3SubjectFormsProvider>
                                                                                                                </F3BColumnWidthProvider>
                                                                                                                </F3TitleRegisterProvider>
                                                                                                                </F3TextTreatmentProvider>
                                                                                                                </F3StackOrderingProvider>
                                                                                                                </F3BStickyOffsetProvider>
                                                                                                                </F3TitleCopyProvider>
                                                                                                                </F3VisibilityProvider>
                                                                                                                </F3HoverTreatmentProvider>
                                                                                                                </F3AConceptProvider>
                                                                                                                </F3BConceptProvider>
                                                                                                                </F3EntranceStaggerProvider>
                                                                                                                </F3TiltRangeProvider>
                                                                                                                </F3BPathProvider>
                                                                                                                </GateAIonS02ArtifactTreatmentProvider>
                                                                                                                </GateAIonArtifactPlaygroundProvider>
                                                                                                                </GateAIonOutcomesModeProvider>
                                                                                                                </GateAIonS07RowIdProvider>
                                                                                                                </GateAIonS03ExtE1LeanDirectionProvider>
                                                                                                                </GateAIonS03ExtE1ThemesStyleProvider>
                                                                                                                </GateAIonS03NativePersonaLayoutProvider>
                                                                                                                </GateAIonS03SubSectionGapProvider>
                                                                                                                </GateAIonS03PersonaContentDensityProvider>
                                                                                                                </GateAIonS03PersonaArtifactProvider>
                                                                                                              </GateAIonS03DirectionProvider>
                                                                                                            </GateAIonProgressTrackProvider>
                                                                                                          </GateAIonMetaStripPositionProvider>
                                                                                                        </GateAIonS01MetaStripProvider>
                                                                                                        </GateAIonS01TldrRegisterProvider>
                                                                                                      </GateAIonS01ContributionGridProvider>
                                                                                                    </GateAIonTldrPositionProvider>
                                                                                                  </GateAIonS05GuardrailsLayoutProvider>
                                                                                                  </GateAIonHeroDensityModeProvider>
                                                                                                  </GateAIonEyebrowChunkGapProvider>
                                                                                                  </GateAIonSectionNumberSpacingProvider>
                                                                                                </GateAIonEyebrowSpacingProvider>
                                                                                              </GateAIonPreTocHeroWidthProvider>
                                                                                            </GateAIonSection01PositionProvider>
                                                                                          </GateAIonHookModeProvider>
                                                                                        </GateAIonFinalImageWidthProvider>
                                                                                      </GateAIonBodyImageWidthProvider>
                                                                                    </GateAIonHeroBleedProvider>
                                                                                  </GateAIonDualContainerRatioProvider>
                                                                                </GateAIonDualContainerEnabledProvider>
                                                                              </GateAIonImageWidthProvider>
                                                                            </GateAIonContentAlignmentProvider>
                                                                          </GateAIonTextColumnWidthProvider>
                                                                        </GateAIonInternalGapProvider>
                                                                      </GateAIonWithinSectionDividerProvider>
                                                                    </GateAIonSectionNumberStyleProvider>
                                                                  </GateAIonHeroAspectProvider>
                                                                </GateAIonBorderRadiusProvider>
                                                              </GateAIonHeroPositionProvider>
                                                            </GateAIonHeroHeightProvider>
                                                          </GateAIonDividerStyleProvider>
                                                      </GateAIonTldrStyleProvider>
                                                    </GateAIonEyebrowStyleProvider>
                                                  </Narrow4EyebrowPlacementProvider>
                                                  </InlineEmphasisTestProvider>
                                                  </PullQuoteRegisterTestProvider>
                                                  </Narrow4FeaturedProofModeProvider>
                                                </Narrow4StandardAspectVarianceProvider>
                                              </Narrow4FeaturedAspectVarianceProvider>
                                            </Narrow4StandardTagStyleProvider>

                                          </StandardProofModeProvider>
                                        </LabChromeProvider>
                                      </PresetProvider>
                                    </ShellPickerProvider>
                                  </CardScaleProvider>
                                </DensityProvider>
                              </AspectVarianceProvider>
                            </ProofPlacementProvider>
                          </ShippedProofProvider>
                        </CaptionRegisterProvider>
                      </ImageTreatmentProvider>
                    </TitleRegisterProvider>
                  </DividerProvider>
                </CardFrameProvider>
              </MarginProvider>
            </TagStyleProvider>
          </MediaTruthProvider>
        </CtaProvider>
      </LaneProvider>
      </CardFitProvider>
      </MediaFrameProvider>
    </DirectionScope>
    </DirectionModeProvider>
  );
}
