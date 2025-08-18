{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import React, \{ useState \} from 'react';\
import \{ Mic, AudioWaveform, Sparkles \} from 'lucide-react';\
import \{ Card, CardContent \} from '@/components/ui/card';\
import \{ Tabs, TabsContent, TabsList, TabsTrigger \} from '@/components/ui/tabs';\
import \{ VoiceModelCreator \} from '@/components/VoiceModelCreator';\
import \{ TextToSpeechGenerator \} from '@/components/TextToSpeechGenerator';\
\
const Index = () => \{\
  const [activeTab, setActiveTab] = useState('create');\
\
  const handleModelCreated = () => \{\
    setActiveTab('generate');\
  \};\
\
  return (\
    <div className="min-h-screen bg-gradient-background">\
      \{/* Header */\}\
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">\
        <div className="container mx-auto px-4 py-6">\
          <div className="flex items-center justify-between">\
            <div className="flex items-center gap-3">\
              <div className="relative">\
                <div className="absolute inset-0 bg-gradient-primary rounded-lg blur-lg opacity-30"></div>\
                <div className="relative bg-gradient-primary p-2 rounded-lg shadow-glow">\
                  <AudioWaveform className="h-6 w-6 text-primary-foreground" />\
                </div>\
              </div>\
              <div>\
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">\
                  Voice Clone Studio\
                </h1>\
                <p className="text-sm text-muted-foreground">\
                  Create and manage AI voice models\
                </p>\
              </div>\
            </div>\
            \
            <div className="flex items-center gap-2">\
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-card/50 px-2 py-1 rounded-full border border-border/50">\
                <Sparkles className="h-3 w-3 text-primary" />\
                <span>AI Powered</span>\
              </div>\
            </div>\
          </div>\
        </div>\
      </header>\
\
      \{/* Main Content */\}\
      <main className="container mx-auto px-4 py-8">\
        <div className="max-w-4xl mx-auto">\
          \{/* Hero Section */\}\
          <div className="text-center mb-12">\
            <h2 className="text-4xl md:text-5xl font-bold mb-4">\
              Clone Any Voice with\{' '\}\
              <span className="bg-gradient-primary bg-clip-text text-transparent">\
                AI Precision\
              </span>\
            </h2>\
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">\
              Upload audio samples to create custom voice models, then generate natural-sounding speech \
              from any text with advanced AI technology.\
            </p>\
          </div>\
\
          \{/* Main Interface */\}\
          <Card className="shadow-card border-border/50 bg-card/80 backdrop-blur-sm">\
            <CardContent className="p-0">\
              <Tabs value=\{activeTab\} onValueChange=\{setActiveTab\} className="w-full">\
                <div className="border-b border-border/50 bg-gradient-secondary/50 p-1 rounded-t-lg">\
                  <TabsList className="grid w-full grid-cols-2 bg-transparent">\
                    <TabsTrigger \
                      value="create" \
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"\
                    >\
                      <Mic className="h-4 w-4" />\
                      Create Model\
                    </TabsTrigger>\
                    <TabsTrigger \
                      value="generate"\
                      className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm"\
                    >\
                      <AudioWaveform className="h-4 w-4" />\
                      Generate Speech\
                    </TabsTrigger>\
                  </TabsList>\
                </div>\
\
                <div className="p-6">\
                  <TabsContent value="create" className="mt-0">\
                    <VoiceModelCreator onModelCreated=\{handleModelCreated\} />\
                  </TabsContent>\
\
                  <TabsContent value="generate" className="mt-0">\
                    <TextToSpeechGenerator />\
                  </TabsContent>\
                </div>\
              </Tabs>\
            </CardContent>\
          </Card>\
\
          \{/* Features Grid */\}\
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">\
            <Card className="shadow-card border-border/50 bg-card/50 backdrop-blur-sm">\
              <CardContent className="p-6 text-center">\
                <div className="bg-gradient-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">\
                  <Mic className="h-6 w-6 text-primary" />\
                </div>\
                <h3 className="font-semibold mb-2">High-Quality Models</h3>\
                <p className="text-sm text-muted-foreground">\
                  Create voice models from MP3 or WAV files with advanced AI processing\
                </p>\
              </CardContent>\
            </Card>\
\
            <Card className="shadow-card border-border/50 bg-card/50 backdrop-blur-sm">\
              <CardContent className="p-6 text-center">\
                <div className="bg-gradient-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">\
                  <AudioWaveform className="h-6 w-6 text-primary" />\
                </div>\
                <h3 className="font-semibold mb-2">Natural Speech</h3>\
                <p className="text-sm text-muted-foreground">\
                  Generate natural-sounding speech with customizable speed and format\
                </p>\
              </CardContent>\
            </Card>\
\
            <Card className="shadow-card border-border/50 bg-card/50 backdrop-blur-sm">\
              <CardContent className="p-6 text-center">\
                <div className="bg-gradient-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">\
                  <Sparkles className="h-6 w-6 text-primary" />\
                </div>\
                <h3 className="font-semibold mb-2">AI Powered</h3>\
                <p className="text-sm text-muted-foreground">\
                  Leveraging cutting-edge AI technology for professional results\
                </p>\
              </CardContent>\
            </Card>\
          </div>\
        </div>\
      </main>\
\
      \{/* Footer */\}\
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-20">\
        <div className="container mx-auto px-4 py-8">\
          <div className="text-center text-sm text-muted-foreground">\
            <p>Voice Clone Studio - Create AI voice models with precision</p>\
          </div>\
        </div>\
      </footer>\
    </div>\
  );\
\};\
\
export default Index;}