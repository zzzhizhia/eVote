
'use client';

import { useState, useEffect, type FormEvent, useRef, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, ListPlus, CalendarClock, UserCheck, Users, CheckSquare, Square, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from "@/hooks/use-toast";
import type { Poll, PollCandidate } from '@/lib/types';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CreatePollPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  const [pollTitle, setPollTitle] = useState('');
  const [currentCandidateName, setCurrentCandidateName] = useState('');
  const [currentCandidateAvatarFile, setCurrentCandidateAvatarFile] = useState<File | null>(null);
  const [currentCandidateAvatarPreview, setCurrentCandidateAvatarPreview] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<PollCandidate[]>([]);
  const [scheduledCloseTime, setScheduledCloseTime] = useState<string>('');
  const [voteLimitEnabled, setVoteLimitEnabled] = useState(false);
  const [maxVotesPerClient, setMaxVotesPerClient] = useState(1);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [maxSelections, setMaxSelections] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (!data.isAdmin) {
          router.push('/admin');
        } else {
          setIsAuthLoading(false);
        }
      })
      .catch(() => router.push('/admin'));
  }, [router]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentCandidateAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentCandidateAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCurrentCandidateAvatarFile(null);
      setCurrentCandidateAvatarPreview(null);
    }
  };

  const handleAddCandidate = async () => {
    if (!currentCandidateName.trim()) {
      toast({
        title: t('toast.candidateNameEmpty'),
        description: t('toast.candidateNameEmptyDescription'),
        variant: "destructive",
      });
      return;
    }

    let avatarUrl = 'https://placehold.co/150x150.png'; 
    let dataAiHint = 'person placeholder'; 

    if (currentCandidateAvatarFile) {
      try {
        avatarUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(currentCandidateAvatarFile);
        });
        dataAiHint = 'uploaded avatar'; 
      } catch (error) {
        console.error("Error reading avatar file:", error);
        toast({
          title: t('toast.avatarUploadError'),
          description: t('toast.avatarUploadErrorDescription'),
          variant: "destructive",
        });
      }
    }

    const newCandidate: PollCandidate = {
      id: `${Date.now()}${Math.random().toString(36).substring(2, 9)}`, // Ensure unique ID
      name: currentCandidateName.trim(),
      avatarUrl,
      dataAiHint,
    };
    setCandidates(prev => [...prev, newCandidate]);
    setCurrentCandidateName('');
    setCurrentCandidateAvatarFile(null);
    setCurrentCandidateAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''; 
    }
  };

  const handleRemoveCandidate = (candidateId: string) => {
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pollTitle.trim()) {
      toast({ title: t('toast.pollTitleEmpty'), description: t('toast.pollTitleEmptyDescription'), variant: "destructive" });
      return;
    }
    if (candidates.length < 2) {
      toast({ title: t('toast.notEnoughCandidates'), description: t('toast.notEnoughCandidatesDescription'), variant: "destructive" });
      return;
    }
    if (voteLimitEnabled && maxVotesPerClient < 1) {
      toast({ title: t('toast.invalidVoteLimit'), description: t('toast.invalidVoteLimitDescription'), variant: "destructive" });
      return;
    }
    if (isMultiSelect && maxSelections < 1) {
      toast({ title: t('toast.invalidMaxSelections'), description: t('toast.invalidMaxSelectionsDescription'), variant: "destructive" });
      return;
    }
    if (isMultiSelect && maxSelections > candidates.length) {
        toast({ title: t('toast.invalidMaxSelectionsTooLarge'), description: t('toast.invalidMaxSelectionsTooLargeDescription'), variant: "destructive" });
        return;
    }

    setIsLoading(true);

    const newPollPayload: Omit<Poll, 'votes'> & { id?: string } = { // id is optional for creation, server will generate
      id: `${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
      title: pollTitle.trim(),
      candidates,
      isOpen: true,
      scheduledCloseTime: scheduledCloseTime ? new Date(scheduledCloseTime).toISOString() : null,
      voteLimitEnabled,
      maxVotesPerClient: voteLimitEnabled ? maxVotesPerClient : 1,
      isMultiSelect,
      maxSelections: isMultiSelect ? maxSelections : 1,
    };

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPollPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create poll');
      }
      
      const createdPoll: Poll = await response.json();

      toast({
        title: t('toast.pollCreatedSuccess'),
        description: t('toast.pollCreatedSuccessDescription', { title: createdPoll.title }),
      });
      router.push('/admin/dashboard');
    } catch (error) {
      console.error("Failed to save poll:", error);
      const message = error instanceof Error ? error.message : t('toast.errorSavingPollDescription');
      toast({
        title: t('toast.errorSavingPoll'),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="items-center text-center">
          <ListPlus className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold">{t('admin.createPoll.title')}</CardTitle>
          <CardDescription className="text-lg">{t('admin.createPoll.description')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="pollTitle" className="text-base">{t('admin.createPoll.pollTitleLabel')}</Label>
              <Input
                id="pollTitle"
                type="text"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                placeholder={t('admin.createPoll.pollTitlePlaceholder')}
                className="text-base"
                required
              />
            </div>

            <div className="space-y-3 border p-4 rounded-md shadow-sm">
              <Label className="text-base font-medium">{t('admin.createPoll.pollSettingsTitle')}</Label>
              <div className="space-y-2">
                <Label htmlFor="scheduledCloseTime" className="text-sm flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" /> {t('admin.createPoll.scheduledCloseTimeLabel')}
                </Label>
                <Input
                  id="scheduledCloseTime"
                  type="datetime-local"
                  value={scheduledCloseTime}
                  onChange={(e) => setScheduledCloseTime(e.target.value)}
                  className="text-base"
                  min={new Date().toISOString().slice(0, 16)} // Prevent past dates
                />
                <p className="text-xs text-muted-foreground">{t('admin.createPoll.scheduledCloseTimeDescription')}</p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                {voteLimitEnabled ? <UserCheck className="h-5 w-5 text-green-500" /> : <Users className="h-5 w-5 text-muted-foreground" />}
                <Label htmlFor="voteLimitSwitch" className="text-sm flex-grow">
                  {t('admin.createPoll.limitVotesLabel')}
                </Label>
                <Switch
                  id="voteLimitSwitch"
                  checked={voteLimitEnabled}
                  onCheckedChange={setVoteLimitEnabled}
                  aria-label={t('admin.createPoll.limitVotesLabel')}
                />
              </div>
              {voteLimitEnabled && (
                <div className="space-y-1 pl-8">
                  <Label htmlFor="maxVotesPerClient" className="text-xs text-muted-foreground">{t('admin.createPoll.maxVotesPerClientLabel')}</Label>
                  <Input
                    id="maxVotesPerClient"
                    type="number"
                    value={maxVotesPerClient}
                    onChange={(e) => setMaxVotesPerClient(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min="1"
                    className="text-sm h-8 w-24"
                  />
                   <p className="text-xs text-muted-foreground">{t('admin.createPoll.voteLimitBypassNote')}</p>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                {isMultiSelect ? <CheckSquare className="h-5 w-5 text-blue-500" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                <Label htmlFor="multiSelectSwitch" className="text-sm flex-grow">
                  {t('admin.createPoll.enableMultiSelectLabel')}
                </Label>
                <Switch
                  id="multiSelectSwitch"
                  checked={isMultiSelect}
                  onCheckedChange={setIsMultiSelect}
                  aria-label={t('admin.createPoll.enableMultiSelectLabel')}
                />
              </div>
              {isMultiSelect && (
                <div className="space-y-1 pl-8">
                  <Label htmlFor="maxSelections" className="text-xs text-muted-foreground">{t('admin.createPoll.maxSelectionsLabel')}</Label>
                  <Input
                    id="maxSelections"
                    type="number"
                    value={maxSelections}
                    onChange={(e) => setMaxSelections(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min="1"
                    className="text-sm h-8 w-24"
                  />
                   <p className="text-xs text-muted-foreground">{t('admin.createPoll.maxSelectionsDescription')}</p>
                </div>
              )}
            </div>


            <div className="space-y-4">
              <Label className="text-base font-medium">{t('admin.createPoll.candidatesTitle')}</Label>
              {candidates.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto p-2 rounded-md border">
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-md shadow-sm">
                      <div className="flex items-center gap-3">
                        <Image src={candidate.avatarUrl} alt={candidate.name} width={40} height={40} className="rounded-full object-cover" data-ai-hint={candidate.dataAiHint} />
                        <span className="text-sm font-medium">{candidate.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCandidate(candidate.id)}
                        aria-label={t('admin.createPoll.removeCandidateAriaLabel', { candidateName: candidate.name })}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="p-4 border rounded-lg space-y-3 shadow-sm bg-card">
                 <Label htmlFor="candidateName" className="text-sm font-medium">{t('admin.createPoll.addNewCandidateLabel')}</Label>
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-grow space-y-1">
                    <Label htmlFor="candidateNameInput" className="text-xs text-muted-foreground">{t('admin.createPoll.candidateNameLabel')}</Label>
                    <Input
                      id="candidateNameInput"
                      type="text"
                      value={currentCandidateName}
                      onChange={(e) => setCurrentCandidateName(e.target.value)}
                      placeholder={t('admin.createPoll.candidateNamePlaceholder')}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                     <Label htmlFor="candidateAvatar" className="text-xs text-muted-foreground">{t('admin.createPoll.candidateAvatarLabel')}</Label>
                    <Input
                      id="candidateAvatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      ref={avatarInputRef}
                      className="text-sm file:mr-2 file:py-1.5 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-muted file:text-muted-foreground hover:file:bg-primary/10"
                    />
                  </div>
                  {currentCandidateAvatarPreview && (
                    <Image src={currentCandidateAvatarPreview} alt="Avatar preview" width={40} height={40} className="rounded-full object-cover self-center sm:self-end" data-ai-hint="avatar preview" />
                  )}
                </div>
                 <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCandidate}
                    className="w-full sm:w-auto shadow-sm"
                    disabled={!currentCandidateName.trim()}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('admin.createPoll.addCandidateButton')}
                  </Button>
              </div>
               {candidates.length === 0 && <p className="text-sm text-muted-foreground text-center pt-2">{t('admin.createPoll.addAtLeastTwoCandidates')}</p>}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" size="lg" className="w-full shadow-lg" disabled={isLoading || candidates.length < 2}>
              {isLoading ? t('admin.createPoll.savingPollButton') : t('admin.createPoll.savePollButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
