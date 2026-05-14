import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Users, Settings, Zap, Activity,
  Globe, MessageSquare, Plus, Trash2, CheckCircle2,
  XCircle, Clock, Play, Pause, BarChart3,
  Image as ImageIcon, RefreshCw, LayoutDashboard, Hash,
  Settings2, Palette, Sparkles, MonitorSmartphone, Minus
} from 'lucide-react';
import { io } from 'socket.io-client';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Textarea } from './components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './components/ui/Card';
import { Label } from './components/ui/Label';
import { Switch } from './components/ui/Switch';
import { Slider } from './components/ui/Slider';
import { Badge } from './components/ui/Badge';
import { cn } from './lib/utils';
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from 'recharts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'webhooks' | 'settings'>('dashboard');
  
  // States
  const [message, setMessage] = useState('');
  
  const [webhooks, setWebhooks] = useState<any[]>([]);

  const [autoMode, setAutoMode] = useState(false);
  const [autoSpeed, setAutoSpeed] = useState(2); // msgs per sec
  
  const [deliveryStats, setDeliveryStats] = useState({
    success: 0,
    failed: 0,
    pending: 0
  });

  // Chart data
  const [chartData, setChartData] = useState<any[]>([]);

  // Particles generator
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10
  }));

  // Backend Integration Hook
  const socketRef = useRef<any>(null);
  const autoModeRef = useRef(autoMode);
  const autoSpeedRef = useRef(autoSpeed);
  const messageRef = useRef(message);

  useEffect(() => {
    autoModeRef.current = autoMode;
  }, [autoMode]);

  useEffect(() => {
    autoSpeedRef.current = autoSpeed;
  }, [autoSpeed]);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to backend');
    });

    socket.on('stats-update', (stats: any) => {
      setDeliveryStats(stats);
    });

    socket.on('chart-update', (data: any) => {
      setChartData(data);
    });

    socket.on('webhooks-update', (webhooks: any) => {
      setWebhooks(webhooks);
    });

    socket.on('auto-status', (status: { running: boolean }) => {
      if (status.running !== autoMode) {
        setAutoMode(status.running);
      }
    });

    fetch('/api/webhooks')
      .then(res => res.json())
      .then(data => setWebhooks(data))
      .catch(err => console.error('Failed to fetch webhooks:', err));

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setDeliveryStats(data.stats);
        setChartData(data.chart || []);
      })
      .catch(err => console.error('Failed to fetch stats:', err));

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    try {
      await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleToggleAuto = async () => {
    if (autoMode) {
      try {
        await fetch('/api/auto/stop', { method: 'POST' });
        setAutoMode(false);
      } catch (err) {
        console.error('Failed to stop auto mode:', err);
      }
    } else {
      if (!message.trim()) return;
      try {
        await fetch('/api/auto/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, speed: autoSpeed })
        });
        setAutoMode(true);
      } catch (err) {
        console.error('Failed to start auto mode:', err);
      }
    }
  };

  const handleAddWebhook = async (name: string, url: string) => {
    try {
      await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url })
      });
    } catch (err) {
      console.error('Failed to add webhook:', err);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete webhook:', err);
    }
  };

  const handleToggleWebhook = async (id: string) => {
    try {
      await fetch(`/api/webhooks/${id}/toggle`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to toggle webhook:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex overflow-hidden relative selection:bg-neon-blue/30 selection:text-neon-blue font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rendering-crisp-edges">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-discord/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-neon-purple/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/10 rounded-full blur-[150px] mix-blend-screen"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
        {particles.map(p => (
           <motion.div
            key={p.id}
            className="absolute bg-white rounded-full mix-blend-screen"
            style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
            animate={{
              y: ["0%", "-100%"],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Sidebar (Desktop) */}
      <nav className="hidden md:flex w-20 lg:w-64 border-r border-white/10 bg-black/60 backdrop-blur-2xl z-20 flex-col items-center lg:items-start py-6 relative shrink-0">
        <div className="flex items-center gap-3 px-0 lg:px-6 mb-10 w-full justify-center lg:justify-start">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.4)]">
            <Send className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl hidden lg:block tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">WSP</span>
        </div>

        <div className="w-full flex-1 flex flex-col gap-2 px-3 lg:px-4">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={Hash} label="Webhooks" active={activeTab === 'webhooks'} onClick={() => setActiveTab('webhooks')} badge={webhooks.length.toString()} />
          <NavItem icon={Settings2} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>

        <div className="w-full px-4 hidden lg:block mt-auto border-t border-white/5 pt-6">
          <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-neon-blue/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            <div className="relative z-10 flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neon-blue">Pro Plan Active</span>
              <div className="flex items-end gap-2">
                <span className="font-display text-2xl font-bold">1.4M</span>
                <span className="text-sm text-white/50 mb-1">msgs sent</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10 custom-scrollbar">
        {/* Header */}
        <header className="h-20 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.4)]">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg md:text-2xl font-bold tracking-tight">Mission Control</h1>
              <p className="text-xs md:text-sm text-white/50 hidden sm:block">Manage payloads and broadcasting clusters.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Systems Operational
            </div>
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8 md:w-10 md:h-10">
              <Globe className="w-4 h-4 text-white/70" />
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8">
          
          {activeTab === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 md:space-y-8"
            >
              {/* Top Analytics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Sent" value={deliveryStats.success.toLocaleString()} icon={CheckCircle2} color="emerald" trend="+12.5% today" />
            <StatCard title="Failed Payloads" value={deliveryStats.failed.toString()} icon={XCircle} color="red" trend="-2.1% today" />
            <StatCard title="Pending Queue" value={autoMode ? deliveryStats.pending.toString() : "0"} icon={Clock} color="yellow" pulse={autoMode} />
            <div className="col-span-1 sm:col-span-2 lg:col-span-1 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-5 md:p-6 relative overflow-hidden group hover:border-discord/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-discord/5 to-transparent pointer-events-none" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-white/50">Send Speed</span>
                <Zap className={cn("w-5 h-5", autoMode ? "text-discord animate-pulse" : "text-white/20")} />
              </div>
              <div className="flex items-end gap-2">
                <span className="font-display text-3xl font-bold">{autoMode ? autoSpeed : 0}</span>
                <span className="text-sm text-white/50 mb-1">req/sec</span>
              </div>
              <div className="mt-4 h-1 w-full bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-discord transition-all duration-300" 
                  style={{ width: autoMode ? `${(autoSpeed / 10000) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Column 1: Compose & Identity */}
            <div className="xl:col-span-2 flex flex-col gap-8">
              
              <Card neon>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                      <MessageSquare className="w-5 h-5 text-neon-blue" />
                    </div>
                    <div>
                      <CardTitle>Payload Composer</CardTitle>
                      <CardDescription>Draft your message for multi-webhook broadcasting.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Message Content</Label>
                    <div className="relative group/textarea">
                      <div className="absolute -inset-1 bg-gradient-to-r from-discord to-neon-purple rounded-lg blur opacity-0 group-hover/textarea:opacity-20 transition duration-500"></div>
                      <Textarea 
                        placeholder="Type your message here... Use markdown for formatting." 
                        className="relative min-h-[160px] bg-black/60 border-white/10"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/40">
                      <span>{message.length} characters</span>
                      <span>Markdown Supported</span>
                    </div>
                  </div>

                  {/* Action Bar inside Composer */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1 sm:flex-none"><ImageIcon className="w-4 h-4 mr-2" /> Attach</Button>
                      <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">Templates</Button>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setMessage('')} className="flex-1 sm:flex-none">Clear</Button>
                      <Button variant="default" className="flex-1 sm:w-32 group hover:shadow-[0_0_20px_rgba(88,101,242,0.6)]" onClick={handleSendMessage}>
                        <Send className="w-4 h-4 mr-2 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" /> 
                        Deploy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart Activity */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Broadcast Telemetry</CardTitle>
                      <CardDescription>Realtime delivery volume.</CardDescription>
                    </div>
                    <Activity className="w-5 h-5 text-neon-purple hidden sm:block" />
                  </div>
                </CardHeader>
                <CardContent className="h-[200px] sm:h-[250px] p-2 sm:p-6 sm:pt-0">
                  <div className="h-full w-full mt-2 sm:mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="time" hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="msgs" stroke="#b026ff" strokeWidth={3} dot={false} animationDuration={300} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Column 2: Identity & Automation */}
            <div className="flex flex-col gap-8">
              
              {/* Message Preview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                      <MonitorSmartphone className="w-5 h-5 text-white/80" />
                    </div>
                    <div>
                      <CardTitle>Message Preview</CardTitle>
                      <CardDescription>How your payload appears in Discord.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  
                  {/* Discord Preview Mock */}
                  <div className="p-4 rounded-xl bg-[#36393f] border border-[#202225] shadow-inner relative hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all">
                    <div className="absolute right-3 top-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-discord/20 text-discord">Preview</div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#202225] overflow-hidden flex-shrink-0 border border-white/5">
                        <div className="w-full h-full bg-discord flex items-center justify-center">
                          <span className="text-white font-bold opacity-80">W</span>
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-white/90 text-[15px] truncate max-w-[150px]">Webhook</span>
                          <span className="text-[10px] bg-discord text-white px-1 rounded font-bold">APP</span>
                        </div>
                        <p className="text-[#dcddde] text-[15px] leading-relaxed mt-1 whitespace-pre-wrap break-words">
                          {message || 'This is how your message will look...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Automation Subsystem */}
              <Card className="border-discord/20" glowColor={autoMode ? "rgba(88,101,242,0.15)" : undefined}>
                <CardHeader className="pb-4">
                   <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 rounded-lg bg-discord/10 border border-discord/30 relative">
                        {autoMode && <span className="absolute -inset-1 bg-discord/30 blur-sm rounded-lg animate-pulse" />}
                        <Zap className="w-5 h-5 text-discord relative z-10" />
                      </div>
                      <CardTitle>Auto System</CardTitle>
                    </div>
                    <Switch checked={autoMode} onCheckedChange={setAutoMode} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="p-4 rounded-lg bg-black/50 border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="mb-0 text-white/70">Rate Limit Strategy</Label>
                      <Badge variant="outline" className="text-[10px] border-discord/30 text-discord">Safe Mode</Badge>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-3 text-white/50">
                          <span>Speed</span>
                          <span className="text-white font-mono">{autoSpeed} req/s</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-8 w-8 shrink-0 rounded-full bg-black/40 hover:bg-white/10" 
                            disabled={autoSpeed <= 1}
                            onClick={() => setAutoSpeed(Math.max(1, autoSpeed - 1))}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Slider value={autoSpeed} onValueChange={setAutoSpeed} min={1} max={10000} />
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-8 w-8 shrink-0 rounded-full bg-black/40 hover:bg-white/10" 
                            disabled={autoSpeed >= 10000}
                            onClick={() => setAutoSpeed(Math.min(10000, autoSpeed + 1))}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant={autoMode ? "destructive" : "default"} 
                    className={cn("w-full h-12 relative overflow-hidden group", autoMode ? "" : "bg-discord hover:bg-discord-hover")}
                    onClick={handleToggleAuto}
                  >
                    <div className={cn("absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] transition-transform duration-1000", autoMode ? "" : "group-hover:translate-x-[200%]")} />
                    {autoMode ? (
                      <><Pause className="w-5 h-5 mr-2" /> Halt Execution</>
                    ) : (
                      <><Play className="w-5 h-5 mr-2 ml-1" /> Initialize Sequence</>
                    )}
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>
          </motion.div>
          )}

          {/* Webhooks View */}
          {activeTab === 'webhooks' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 md:space-y-8"
            >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">Active Endpoints</h2>
                <p className="text-sm text-white/50">Manage your connected Discord channels.</p>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <Button variant="secondary" className="flex-1 sm:flex-none"><Settings className="w-4 h-4 mr-2" /> Manage All</Button>
                <Button className="flex-1 sm:flex-none bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.3)]" onClick={() => {
                      const name = prompt('Enter webhook name:');
                      if (!name) return;
                      const url = prompt('Enter Discord webhook URL:');
                      if (!url) return;
                      handleAddWebhook(name, url);
                    }}><Plus className="w-4 h-4 mr-2" /> Add Endpoint</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {webhooks.map((hook, i) => (
                  <motion.div
                    key={hook.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className={cn("transition-all duration-300", hook.active ? "border-discord/30 shadow-[0_0_15px_rgba(88,101,242,0.05)] bg-discord/5" : "opacity-60")}>
                      <CardContent className="p-5 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Switch checked={hook.active} onCheckedChange={() => handleToggleWebhook(hook.id)} />
                            <div className="flex flex-col">
                              <span className="font-semibold text-white/90">{hook.name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={cn("w-1.5 h-1.5 rounded-full", hook.status === 'connected' ? "bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-red-400")} />
                                <span className="text-[10px] uppercase tracking-wider text-white/40">{hook.status}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-white/30 hover:text-red-400" onClick={() => handleDeleteWebhook(hook.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="relative">
                          <Input value={hook.url} readOnly placeholder="Webhook URL..." className="pr-20 text-xs font-mono h-9 bg-black/60 focus-visible:ring-1 focus-visible:ring-discord/50" type="password" />
                          <Badge variant="secondary" className="absolute right-1 top-1 text-[10px] py-0 bg-white/10 hover:bg-white/20 border-transparent text-white/70">Secret</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            </motion.div>
          )}

          {/* Settings View */}
          {activeTab === 'settings' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 md:space-y-8 max-w-3xl mx-auto"
            >
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Systems Configuration</h2>
                <p className="text-sm md:text-base text-white/50">Fine-tune your application appearance and global behavior.</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize the visual aesthetics of the dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white/80">Compact Mode</Label>
                      <p className="text-sm text-white/40">Reduces spacing across all interfaces.</p>
                    </div>
                    <Switch checked={false} onCheckedChange={() => {}} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white/80">Neon Effects</Label>
                      <p className="text-sm text-white/40">Toggles intense glowing outlines.</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div>
                      <Label className="text-white/80">Animation Intensity</Label>
                      <p className="text-sm text-white/40">Adjust the speed and presence of motion.</p>
                    </div>
                     <Slider value={75} onValueChange={() => {}} min={0} max={100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications & Alerts</CardTitle>
                  <CardDescription>Manage how the system communicates with you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white/80">Sound Effects</Label>
                      <p className="text-sm text-white/40">Play sounds on successful or failed dispatches.</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white/80">Desktop Notifications</Label>
                      <p className="text-sm text-white/40">Show native OS alerts for background tasks.</p>
                    </div>
                    <Switch checked={false} onCheckedChange={() => {}} />
                  </div>
                </CardContent>
                <CardFooter className="bg-black/20 border-t border-white/5 py-4">
                  <Button variant="default" className="w-full">Save Changes</Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl z-50 flex items-center justify-around px-2 shadow-[0_4px_40px_rgba(0,0,0,0.8)]">
        <NavItemMobile icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavItemMobile icon={Hash} label="Webhooks" active={activeTab === 'webhooks'} onClick={() => setActiveTab('webhooks')} badge={webhooks.length.toString()} />
        <NavItemMobile icon={Settings2} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, badge, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-center lg:justify-start gap-3 px-0 lg:px-4 py-3 rounded-lg w-full transition-all duration-200 group relative outline-none focus-visible:ring-2 focus-visible:ring-neon-blue",
        active ? "text-neon-blue bg-neon-blue/10" : "text-white/60 hover:text-white hover:bg-white/5"
      )}
    >
      {active && (
        <motion.div 
          layoutId="activeNav" 
          className="absolute left-0 top-0 bottom-0 w-1 bg-neon-blue rounded-r-full shadow-[0_0_10px_rgba(0,243,255,0.8)] hidden lg:block" 
        />
      )}
      <Icon className={cn("w-5 h-5", active ? "drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]" : "")} />
      <span className="font-medium hidden lg:block">{label}</span>
      {badge && (
        <span className="hidden lg:flex ml-auto bg-white/10 text-white text-[10px] w-5 h-5 items-center justify-center rounded-full border border-white/5">
          {badge}
        </span>
      )}
    </button>
  );
}

function NavItemMobile({ icon: Icon, label, active, badge, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all duration-200 relative",
        active ? "text-neon-blue" : "text-white/50 hover:text-white/80"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]" : "")} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
      {badge && (
        <span className="absolute top-0 right-2 bg-neon-blue text-black font-bold text-[8px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ title, value, icon: Icon, color, trend, pulse }: any) {
  const colorMap = {
    emerald: "text-emerald-400 flex items-center justify-center p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20",
    red: "text-red-400 flex items-center justify-center p-2.5 sm:p-3 rounded-xl bg-red-500/10 border border-red-500/20",
    yellow: "text-yellow-400 flex items-center justify-center p-2.5 sm:p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-5 md:p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/50">{title}</span>
        <div className={cn((colorMap as any)[color] || "", pulse && "animate-pulse shadow-[0_0_15px_currentColor]")}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div className="font-display text-2xl sm:text-3xl font-bold truncate">{value}</div>
      {trend && (
        <div className={cn("text-[10px] sm:text-xs font-medium mt-1 md:mt-2", trend.startsWith('+') ? "text-emerald-400" : "text-red-400")}>
          {trend}
        </div>
      )}
    </div>
  );
}
